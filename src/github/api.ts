import { graphql, GraphqlResponseError } from "@octokit/graphql";

import type {
  Mergeability,
  PullRequest,
  PullRequestDetail,
  PullRequestList,
  PullRequestStatus,
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

const createClient = (token: string) =>
  graphql.defaults({ headers: { authorization: `bearer ${token}` } });

const assertOwnerFound = (
  { repositoryOwner }: PullRequestsQuery,
  owner: string
) => {
  if (!repositoryOwner) {
    throw new Error(`GitHub account "${owner}" was not found.`);
  }
};

const isSessionResponseError = (
  cause: unknown
): cause is GraphqlResponseError<
  { viewer?: SessionQuery["viewer"] | null } | null | undefined
> => cause instanceof GraphqlResponseError;

export const fetchSession = async (token: string) => {
  try {
    return toSession(await createClient(token)<SessionQuery>(SESSION_QUERY));
  } catch (error) {
    if (isSessionResponseError(error) && error.data?.viewer) {
      return toSession({ viewer: error.data.viewer });
    }

    throw error;
  }
};

const fetchViewerTeams = async (
  client: Client,
  owner: string,
  viewer: string
) => {
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
};

const STATUS_BATCH_SIZE = 10;
const MAX_STATUS_REQUESTS = 20;

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );

const fetchRows = async (
  client: Client,
  owner: string,
  onRows?: (list: PullRequestList) => void
) => {
  const rows = new Map<string, PullRequest>();
  let totalCount = 0;

  const fetchPage = async (after: string | null) => {
    const response = await client<PullRequestsQuery>(PULL_REQUESTS_QUERY, {
      owner,
      search: searchQuery(owner),
      first: PAGE_SIZE,
      after,
    } satisfies PullRequestsQueryVariables);

    assertOwnerFound(response, owner);
    totalCount = response.search.issueCount;

    for (const node of nodesOf(response.search)) {
      if (node.__typename === "PullRequest") {
        rows.set(node.id, toPullRequestRow(node));
      }
    }

    onRows?.({ pullRequests: [...rows.values()], totalCount });

    const { hasNextPage, endCursor } = response.search.pageInfo;

    if (hasNextPage && endCursor !== null && endCursor !== "") {
      await fetchPage(endCursor);
    }
  };

  await fetchPage(null);

  return {
    pullRequests: [...rows.values()],
    totalCount,
  } satisfies PullRequestList;
};

const fetchStatuses = async (
  client: Client,
  ids: string[],
  context: ReviewContext
) => {
  const size = Math.max(
    STATUS_BATCH_SIZE,
    Math.ceil(ids.length / MAX_STATUS_REQUESTS)
  );

  const responses = await Promise.all(
    chunk(ids, size).map(
      async (batch) =>
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
};

export const fetchPullRequests = async (
  token: string,
  owner: string,
  viewer: string,
  onRows?: (list: PullRequestList) => void
) => {
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
  } satisfies PullRequestList;
};

const MAX_NODE_IDS = 100;

export const fetchMergeability = async (token: string, ids: string[]) => {
  const client = createClient(token);

  const responses = await Promise.all(
    chunk(ids, MAX_NODE_IDS).map(
      async (batch) =>
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
};

export const fetchPullRequestDetail = async (token: string, id: string) => {
  const { node } = await createClient(token)<PullRequestDetailQuery>(
    PULL_REQUEST_DETAIL_QUERY,
    {
      id,
    } satisfies PullRequestDetailQueryVariables
  );

  if (node?.__typename !== "PullRequest") {
    throw new Error("Pull request was not found.");
  }

  return toPullRequestDetail(node) satisfies PullRequestDetail;
};

const hasHttpStatus = (cause: unknown): cause is { status: number } =>
  typeof cause === "object" &&
  cause !== null &&
  "status" in cause &&
  typeof cause.status === "number";

const httpStatus = (cause: unknown) =>
  hasHttpStatus(cause) ? cause.status : undefined;

export const isAuthError = (cause: unknown) => httpStatus(cause) === 401;

export const isRetryable = (cause: unknown) => {
  const status = httpStatus(cause);

  if (status === 401 || status === 403 || status === 429) {
    return false;
  }

  return !(
    cause instanceof GraphqlResponseError &&
    cause.errors?.some((entry) => entry.type === "RATE_LIMITED") === true
  );
};

export const errorMessage = (cause: unknown) => {
  const status = httpStatus(cause);

  if (status === 401) {
    return "Your GitHub token is invalid or has expired.";
  }

  if (status === 403 || status === 429) {
    return "GitHub refused the request. You may be rate limited or the token lacks access.";
  }

  if (status !== undefined && status >= 500) {
    return `GitHub did not respond in time (HTTP ${status}). Try again shortly.`;
  }

  if (cause instanceof GraphqlResponseError) {
    return [...new Set(cause.errors?.map((entry) => entry.message))].join(" ");
  }

  if (cause instanceof Error) {
    return cause.message;
  }

  return "Something went wrong talking to GitHub.";
};
