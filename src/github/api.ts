import { graphql, GraphqlResponseError } from "@octokit/graphql";
import type { PullRequestDetail, PullRequestList, Session } from "@/types";
import {
  toPullRequest,
  toPullRequestDetail,
  toSession,
  type RawPullRequest,
  type RawPullRequestDetail,
  type RawSession,
} from "./mapping";
import {
  PAGE_SIZE,
  PULL_REQUEST_DETAIL_QUERY,
  PULL_REQUESTS_QUERY,
  SESSION_QUERY,
  VIEWER_TEAMS_QUERY,
  searchQuery,
} from "./queries";

type Client = typeof graphql;

interface OwnerResponse {
  repositoryOwner: { login: string } | null;
}

interface PullRequestsResponse extends OwnerResponse {
  search: {
    issueCount: number;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: (RawPullRequest | null)[];
  };
}

interface ViewerTeamsResponse {
  repositoryOwner: { teams?: { nodes: { slug: string }[] } } | null;
}

interface DetailResponse {
  node: RawPullRequestDetail | null;
}

const createClient = (token: string): Client =>
  graphql.defaults({ headers: { authorization: `bearer ${token}` } });

function assertOwnerFound({ repositoryOwner }: OwnerResponse, owner: string) {
  if (!repositoryOwner) throw new Error(`GitHub account "${owner}" was not found.`);
}

export async function fetchSession(token: string): Promise<Session> {
  try {
    return toSession(await createClient(token)<RawSession>(SESSION_QUERY));
  } catch (error) {
    if (error instanceof GraphqlResponseError && error.data?.viewer) return toSession(error.data);
    throw error;
  }
}

async function fetchViewerTeams(client: Client, owner: string, viewer: string): Promise<string[]> {
  if (owner === viewer) return [];
  try {
    const { repositoryOwner } = await client<ViewerTeamsResponse>(VIEWER_TEAMS_QUERY, {
      owner,
      viewer,
    });
    return repositoryOwner?.teams?.nodes.map((team) => team.slug) ?? [];
  } catch {
    return [];
  }
}

async function fetchAllPullRequests(client: Client, owner: string) {
  const nodes = new Map<string, RawPullRequest>();
  let totalCount = 0;
  let after: string | null = null;
  do {
    const response: PullRequestsResponse = await client<PullRequestsResponse>(PULL_REQUESTS_QUERY, {
      owner,
      search: searchQuery(owner),
      first: PAGE_SIZE,
      after,
    });
    assertOwnerFound(response, owner);
    totalCount = response.search.issueCount;
    for (const node of response.search.nodes) {
      if (node?.id) nodes.set(node.id, node);
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

export async function fetchPullRequestDetail(
  token: string,
  id: string,
): Promise<PullRequestDetail> {
  const { node } = await createClient(token)<DetailResponse>(PULL_REQUEST_DETAIL_QUERY, { id });
  if (!node) throw new Error("Pull request was not found.");
  return toPullRequestDetail(node);
}

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

export function isAuthError(error: unknown): boolean {
  return httpStatus(error) === 401;
}

export function errorMessage(error: unknown): string {
  const status = httpStatus(error);
  if (status === 401) return "Your GitHub token is invalid or has expired.";
  if (status === 403)
    return "GitHub refused the request. You may be rate limited or the token lacks access.";
  if (status !== undefined && status >= 500)
    return `GitHub did not respond in time (HTTP ${status}). Try again shortly.`;
  if (error instanceof GraphqlResponseError) {
    return [...new Set(error.errors?.map((entry) => entry.message))].join(" ");
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong talking to GitHub.";
}
