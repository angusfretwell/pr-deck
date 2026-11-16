import { graphql, GraphqlResponseError } from "@octokit/graphql";
import type { Mergeability, PullRequestDetail, PullRequestList, Session } from "@/types";
import type {
  MergeabilityQuery,
  MergeabilityQueryVariables,
  PullRequestDetailQuery,
  PullRequestDetailQueryVariables,
  PullRequestsQuery,
  PullRequestsQueryVariables,
  SessionQuery,
  ViewerTeamsQuery,
  ViewerTeamsQueryVariables,
} from "./graphql.generated";
import {
  nodesOf,
  toPullRequest,
  toPullRequestDetail,
  toMergeability,
  toSession,
  type RawPullRequest,
} from "./mapping";
import {
  MERGEABILITY_QUERY,
  PAGE_SIZE,
  PULL_REQUEST_DETAIL_QUERY,
  PULL_REQUESTS_QUERY,
  SESSION_QUERY,
  VIEWER_TEAMS_QUERY,
  searchQuery,
} from "./queries";

type Client = typeof graphql;

const createClient = (token: string): Client =>
  graphql.defaults({ headers: { authorization: `bearer ${token}` } });

function assertOwnerFound({ repositoryOwner }: PullRequestsQuery, owner: string) {
  if (!repositoryOwner) throw new Error(`GitHub account "${owner}" was not found.`);
}

export async function fetchSession(token: string): Promise<Session> {
  try {
    return toSession(await createClient(token)<SessionQuery>(SESSION_QUERY));
  } catch (error) {
    if (error instanceof GraphqlResponseError && error.data?.viewer) return toSession(error.data);
    throw error;
  }
}

async function fetchViewerTeams(client: Client, owner: string, viewer: string): Promise<string[]> {
  if (owner === viewer) return [];
  try {
    const { repositoryOwner } = await client<ViewerTeamsQuery>(VIEWER_TEAMS_QUERY, {
      owner,
      viewer,
    } satisfies ViewerTeamsQueryVariables);
    if (repositoryOwner?.__typename !== "Organization") return [];
    return nodesOf(repositoryOwner.teams).map((team) => team.slug);
  } catch {
    return [];
  }
}

async function fetchAllPullRequests(client: Client, owner: string) {
  const nodes = new Map<string, RawPullRequest>();
  let totalCount = 0;
  let after: string | null = null;
  do {
    const response: PullRequestsQuery = await client<PullRequestsQuery>(PULL_REQUESTS_QUERY, {
      owner,
      search: searchQuery(owner),
      first: PAGE_SIZE,
      after,
    } satisfies PullRequestsQueryVariables);
    assertOwnerFound(response, owner);
    totalCount = response.search.issueCount;
    for (const node of nodesOf(response.search)) {
      if (node.__typename === "PullRequest") nodes.set(node.id, node);
    }
    after = response.search.pageInfo.hasNextPage ? response.search.pageInfo.endCursor : null;
  } while (after);
  return { nodes: [...nodes.values()], totalCount };
}

export async function fetchPullRequests(
  token: string,
  owner: string,
  viewer: string,
): Promise<PullRequestList> {
  const client = createClient(token);
  const [viewerTeams, { nodes, totalCount }] = await Promise.all([
    fetchViewerTeams(client, owner, viewer),
    fetchAllPullRequests(client, owner),
  ]);
  return {
    pullRequests: nodes.map((node) => toPullRequest(node, { viewer, viewerTeams })),
    totalCount,
  };
}

const MAX_NODE_IDS = 100;

export async function fetchMergeability(
  token: string,
  ids: string[],
): Promise<Record<string, Mergeability>> {
  const client = createClient(token);
  const batches: string[][] = [];
  for (let start = 0; start < ids.length; start += MAX_NODE_IDS) {
    batches.push(ids.slice(start, start + MAX_NODE_IDS));
  }
  const responses = await Promise.all(
    batches.map((batch) =>
      client<MergeabilityQuery>(MERGEABILITY_QUERY, {
        ids: batch,
      } satisfies MergeabilityQueryVariables),
    ),
  );
  const states: Record<string, Mergeability> = {};
  for (const node of responses.flatMap((response) => nodesOf(response))) {
    if (node.__typename === "PullRequest") states[node.id] = toMergeability(node.mergeable);
  }
  return states;
}

export async function fetchPullRequestDetail(
  token: string,
  id: string,
): Promise<PullRequestDetail> {
  const { node } = await createClient(token)<PullRequestDetailQuery>(PULL_REQUEST_DETAIL_QUERY, {
    id,
  } satisfies PullRequestDetailQueryVariables);
  if (node?.__typename !== "PullRequest") throw new Error("Pull request was not found.");
  return toPullRequestDetail(node);
}

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

export function isAuthError(error: unknown): boolean {
  return httpStatus(error) === 401;
}

export function isRetryable(error: unknown): boolean {
  const status = httpStatus(error);
  if (status === 401 || status === 403 || status === 429) return false;
  return !(
    error instanceof GraphqlResponseError &&
    error.errors?.some((entry) => entry.type === "RATE_LIMITED")
  );
}

export function errorMessage(error: unknown): string {
  const status = httpStatus(error);
  if (status === 401) return "Your GitHub token is invalid or has expired.";
  if (status === 403 || status === 429)
    return "GitHub refused the request. You may be rate limited or the token lacks access.";
  if (status !== undefined && status >= 500)
    return `GitHub did not respond in time (HTTP ${status}). Try again shortly.`;
  if (error instanceof GraphqlResponseError) {
    return [...new Set(error.errors?.map((entry) => entry.message))].join(" ");
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong talking to GitHub.";
}
