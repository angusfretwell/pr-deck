import { graphql, GraphqlResponseError } from "@octokit/graphql";

import type {
  Mergeability,
  PullRequest,
  PullRequestDetail,
  PullRequestList,
  PullRequestStatus,
  Session,
} from "@/types";

import type {
  MergeabilityQuery,
  MergeabilityQueryVariables,
  PullRequestDetailQuery,
  PullRequestDetailQueryVariables,
  PullRequestStatusQuery,
  PullRequestStatusQueryVariables,
  PullRequestsQuery,
  PullRequestsQueryVariables,
  SessionQuery,
  ViewerTeamsQuery,
  ViewerTeamsQueryVariables,
} from "./graphql.generated";
import {
  nodesOf,
  toPullRequestDetail,
  toPullRequestRow,
  toPullRequestStatus,
  toMergeability,
  toSession,
  withStatus,
} from "./mapping";
import type { ReviewContext } from "./mapping";
import {
  MERGEABILITY_QUERY,
  PAGE_SIZE,
  PULL_REQUEST_DETAIL_QUERY,
  PULL_REQUEST_STATUS_QUERY,
  PULL_REQUESTS_QUERY,
  SESSION_QUERY,
  VIEWER_TEAMS_QUERY,
  searchQuery,
} from "./queries";

type Client = typeof graphql;

const createClient = (token: string): Client =>
  graphql.defaults({ headers: { authorization: `bearer ${token}` } });

function assertOwnerFound(
  { repositoryOwner }: PullRequestsQuery,
  owner: string
) {
  if (!repositoryOwner) {
    throw new Error(`GitHub account "${owner}" was not found.`);
  }
}

export async function fetchSession(token: string): Promise<Session> {
  try {
    return toSession(await createClient(token)<SessionQuery>(SESSION_QUERY));
  } catch (error) {
    if (error instanceof GraphqlResponseError && error.data?.viewer) {
      return toSession(error.data);
    }

    throw error;
  }
}

async function fetchViewerTeams(
  client: Client,
  owner: string,
  viewer: string
): Promise<string[]> {
  if (owner === viewer) {
    return [];
  }

  try {
    const { repositoryOwner } = await client<ViewerTeamsQuery>(
      VIEWER_TEAMS_QUERY,
      {
        owner,
        viewer,
      } satisfies ViewerTeamsQueryVariables
    );

    if (repositoryOwner?.__typename !== "Organization") {
      return [];
    }

    return nodesOf(repositoryOwner.teams).map((team) => team.slug);
  } catch {
    return [];
  }
}

const STATUS_BATCH_SIZE = 10;
const MAX_STATUS_REQUESTS = 20;

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
}

async function fetchRows(
  client: Client,
  owner: string,
  onRows: (list: PullRequestList) => void
): Promise<PullRequestList> {
  const rows = new Map<string, PullRequest>();
  let totalCount = 0;
  let after: string | null = null;

  do {
    const response: PullRequestsQuery = await client<PullRequestsQuery>(
      PULL_REQUESTS_QUERY,
      {
        owner,
        search: searchQuery(owner),
        first: PAGE_SIZE,
        after,
      } satisfies PullRequestsQueryVariables
    );

    assertOwnerFound(response, owner);
    totalCount = response.search.issueCount;

    for (const node of nodesOf(response.search)) {
      if (node.__typename === "PullRequest") {
        rows.set(node.id, toPullRequestRow(node));
      }
    }

    onRows({ pullRequests: [...rows.values()], totalCount });
    after = response.search.pageInfo.hasNextPage
      ? response.search.pageInfo.endCursor
      : null;
  } while (after);

  return { pullRequests: [...rows.values()], totalCount };
}

async function fetchStatuses(
  client: Client,
  ids: string[],
  context: ReviewContext
): Promise<Map<string, PullRequestStatus>> {
  const size = Math.max(
    STATUS_BATCH_SIZE,
    Math.ceil(ids.length / MAX_STATUS_REQUESTS)
  );

  const responses = await Promise.all(
    chunk(ids, size).map(async (batch) =>
      await client<PullRequestStatusQuery>(PULL_REQUEST_STATUS_QUERY, {
        ids: batch,
      } satisfies PullRequestStatusQueryVariables)
    )
  );

  const statuses = new Map<string, PullRequestStatus>();

  for (const node of responses.flatMap((response) => nodesOf(response))) {
    if (node.__typename === "PullRequest") {
      statuses.set(node.id, toPullRequestStatus(node, context));
    }
  }

  return statuses;
}

export async function fetchPullRequests(
  token: string,
  owner: string,
  viewer: string,
  onRows: (list: PullRequestList) => void = () => {}
): Promise<PullRequestList> {
  const client = createClient(token);

  const [viewerTeams, rows] = await Promise.all([
    fetchViewerTeams(client, owner, viewer),
    fetchRows(client, owner, onRows),
  ]);

  const statuses = await fetchStatuses(
    client,
    rows.pullRequests.map((pr) => pr.id),
    { viewer, viewerTeams }
  );

  return {
    ...rows,
    pullRequests: rows.pullRequests.flatMap((pr) => {
      const status = statuses.get(pr.id);

      return status ? [withStatus(pr, status)] : [];
    }),
  };
}

const MAX_NODE_IDS = 100;

export async function fetchMergeability(
  token: string,
  ids: string[]
): Promise<Record<string, Mergeability>> {
  const client = createClient(token);

  const responses = await Promise.all(
    chunk(ids, MAX_NODE_IDS).map(async (batch) =>
      await client<MergeabilityQuery>(MERGEABILITY_QUERY, {
        ids: batch,
      } satisfies MergeabilityQueryVariables)
    )
  );

  const states: Record<string, Mergeability> = {};

  for (const node of responses.flatMap((response) => nodesOf(response))) {
    if (node.__typename === "PullRequest") {
      states[node.id] = toMergeability(node.mergeable);
    }
  }

  return states;
}

export async function fetchPullRequestDetail(
  token: string,
  id: string
): Promise<PullRequestDetail> {
  const { node } = await createClient(token)<PullRequestDetailQuery>(
    PULL_REQUEST_DETAIL_QUERY,
    {
      id,
    } satisfies PullRequestDetailQueryVariables
  );

  if (node?.__typename !== "PullRequest") {
    throw new Error("Pull request was not found.");
  }

  return toPullRequestDetail(node);
}

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  return typeof error.status === "number" ? error.status : undefined;
}

export function isAuthError(error: unknown): boolean {
  return httpStatus(error) === 401;
}

export function isRetryable(error: unknown): boolean {
  const status = httpStatus(error);

  if (status === 401 || status === 403 || status === 429) {
    return false;
  }

  return !(
    error instanceof GraphqlResponseError &&
    error.errors?.some((entry) => entry.type === "RATE_LIMITED")
  );
}

export function errorMessage(error: unknown): string {
  const status = httpStatus(error);

  if (status === 401) {
    return "Your GitHub token is invalid or has expired.";
  }

  if (status === 403 || status === 429) {
    return "GitHub refused the request. You may be rate limited or the token lacks access.";
  }

  if (status !== undefined && status >= 500) {
    return `GitHub did not respond in time (HTTP ${status}). Try again shortly.`;
  }

  if (error instanceof GraphqlResponseError) {
    return [...new Set(error.errors?.map((entry) => entry.message))].join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong talking to GitHub.";
}
