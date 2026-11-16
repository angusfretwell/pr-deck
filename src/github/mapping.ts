import type {
  Account,
  Check,
  CheckState,
  CiState,
  Mergeability,
  PullRequest,
  PullRequestDetail,
  PullRequestList,
  Reviewer,
  ReviewState,
  ReviewVerdict,
  Session,
} from "@/types";

export interface RawAccount {
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface RawActor {
  login: string;
  avatarUrl: string;
}

export interface RawSession {
  viewer: RawAccount & { organizations: { nodes: (RawAccount | null)[] } };
}

export type RawRollupState = "SUCCESS" | "FAILURE" | "ERROR" | "PENDING" | "EXPECTED";
export type RawMergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
export type RawReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";
export type RawReviewState =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "COMMENTED"
  | "DISMISSED"
  | "PENDING";

export interface RawReview {
  state: RawReviewState;
  author: RawActor | null;
}

export type RawRequestedReviewer =
  | { __typename: "User"; login: string }
  | { __typename: "Team"; slug: string }
  | { __typename: "Bot" | "Mannequin" };

export interface RawPullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  headRefName: string;
  mergeable: RawMergeable;
  reviewDecision: RawReviewDecision | null;
  repository: { name: string; owner: { login: string } };
  author: RawActor | null;
  commits: { nodes: { commit: { statusCheckRollup: { state: RawRollupState } | null } }[] };
  latestReviews: { nodes: RawReview[] };
  latestOpinionatedReviews: { nodes: RawReview[] };
  reviewRequests: { nodes: { requestedReviewer: RawRequestedReviewer | null }[] };
}

export type RawCheckRunStatus =
  | "QUEUED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WAITING"
  | "PENDING"
  | "REQUESTED";
export type RawCheckConclusion =
  | "SUCCESS"
  | "FAILURE"
  | "TIMED_OUT"
  | "CANCELLED"
  | "ACTION_REQUIRED"
  | "STARTUP_FAILURE"
  | "SKIPPED"
  | "NEUTRAL"
  | "STALE";

export interface RawCheckRun {
  __typename: "CheckRun";
  name: string;
  status: RawCheckRunStatus;
  conclusion: RawCheckConclusion | null;
  startedAt: string | null;
  completedAt: string | null;
  detailsUrl: string | null;
  isRequired: boolean;
}

export interface RawStatusContext {
  __typename: "StatusContext";
  context: string;
  state: RawRollupState;
  targetUrl: string | null;
  isRequired: boolean;
}

export interface RawPullRequestDetail {
  bodyHTML: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: {
    nodes: {
      commit: {
        statusCheckRollup: { contexts: { nodes: (RawCheckRun | RawStatusContext)[] } } | null;
      };
    }[];
  };
  files: { nodes: { path: string; additions: number; deletions: number }[] } | null;
}

export interface ReviewContext {
  viewer: string;
  viewerTeams: string[];
}

const GHOST: RawActor = {
  login: "ghost",
  avatarUrl: "https://avatars.githubusercontent.com/u/10137?v=4",
};

const CI_STATES: Record<RawRollupState, CiState> = {
  SUCCESS: "pass",
  FAILURE: "fail",
  ERROR: "fail",
  PENDING: "pending",
  EXPECTED: "pending",
};

const MERGEABILITY: Record<RawMergeable, Mergeability> = {
  MERGEABLE: "clean",
  CONFLICTING: "conflict",
  UNKNOWN: "unknown",
};

const VERDICTS: Partial<Record<RawReviewState, ReviewVerdict>> = {
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes",
  COMMENTED: "comment",
};

const CHECK_STATES: Record<RawCheckRunStatus | RawCheckConclusion | RawRollupState, CheckState> = {
  SUCCESS: "pass",
  FAILURE: "fail",
  TIMED_OUT: "fail",
  CANCELLED: "fail",
  ACTION_REQUIRED: "fail",
  STARTUP_FAILURE: "fail",
  ERROR: "fail",
  QUEUED: "pending",
  IN_PROGRESS: "pending",
  COMPLETED: "pending",
  PENDING: "pending",
  REQUESTED: "pending",
  EXPECTED: "pending",
  WAITING: "pending",
  SKIPPED: "skipped",
  NEUTRAL: "skipped",
  STALE: "skipped",
};

export const toMergeability = (raw: RawMergeable): Mergeability => MERGEABILITY[raw];

export function withMergeability(
  list: PullRequestList,
  states: Record<string, Mergeability>,
): PullRequestList {
  return {
    ...list,
    pullRequests: list.pullRequests.map((pr) =>
      pr.id in states ? { ...pr, mergeability: states[pr.id] } : pr,
    ),
  };
}

export function toAccount(raw: RawAccount): Account {
  return { login: raw.login, name: raw.name || raw.login, avatarUrl: raw.avatarUrl };
}

export function toSession({ viewer }: RawSession): Session {
  const account = toAccount(viewer);
  const orgs = viewer.organizations.nodes
    .filter((org) => org !== null)
    .map(toAccount)
    .sort((a, b) => a.login.localeCompare(b.login));
  return { viewer: account, owners: [account, ...orgs] };
}

export function toCi(node: Pick<RawPullRequest, "commits">): CiState {
  const rollup = node.commits.nodes[0]?.commit.statusCheckRollup;
  return rollup ? CI_STATES[rollup.state] : "none";
}

export function toReviewers(
  node: Pick<RawPullRequest, "author" | "latestReviews" | "latestOpinionatedReviews">,
): Reviewer[] {
  const authorLogin = (node.author ?? GHOST).login;
  const reviewers = new Map<string, Reviewer>();
  for (const review of [...node.latestReviews.nodes, ...node.latestOpinionatedReviews.nodes]) {
    const verdict = VERDICTS[review.state];
    const author = review.author ?? GHOST;
    if (!verdict || author.login === authorLogin) continue;
    if (verdict === "comment" && reviewers.has(author.login)) continue;
    reviewers.set(author.login, { login: author.login, avatarUrl: author.avatarUrl, verdict });
  }
  return [...reviewers.values()];
}

export function toReviewState(
  decision: RawReviewDecision | null,
  reviewers: Reviewer[],
): ReviewState {
  const verdicts = new Set(reviewers.map((reviewer) => reviewer.verdict));
  if (decision === "APPROVED") return "approved";
  if (decision === "CHANGES_REQUESTED") return "changes";
  if (decision === "REVIEW_REQUIRED") return verdicts.size > 0 ? "comment" : "none";
  if (verdicts.has("changes")) return "changes";
  if (verdicts.has("approved")) return "approved";
  if (verdicts.has("comment")) return "comment";
  return "none";
}

export function isReviewRequestedFrom(
  node: Pick<RawPullRequest, "reviewRequests">,
  { viewer, viewerTeams }: ReviewContext,
): boolean {
  return node.reviewRequests.nodes.some(({ requestedReviewer }) => {
    if (requestedReviewer?.__typename === "User") return requestedReviewer.login === viewer;
    if (requestedReviewer?.__typename === "Team")
      return viewerTeams.includes(requestedReviewer.slug);
    return false;
  });
}

export function toPullRequest(node: RawPullRequest, context: ReviewContext): PullRequest {
  const author = node.author ?? GHOST;
  const reviewers = toReviewers(node);
  return {
    id: node.id,
    owner: node.repository.owner.login,
    repo: node.repository.name,
    number: node.number,
    title: node.title,
    url: node.url,
    author: author.login,
    authorAvatarUrl: author.avatarUrl,
    isDraft: node.isDraft,
    branch: node.headRefName,
    updatedAt: node.updatedAt,
    ci: toCi(node),
    mergeability: toMergeability(node.mergeable),
    review: toReviewState(node.reviewDecision, reviewers),
    reviewers,
    reviewRequestedFromViewer:
      author.login !== context.viewer && isReviewRequestedFrom(node, context),
  };
}

function secondsBetween(startedAt: string | null, completedAt: string | null): number | null {
  if (!startedAt || !completedAt) return null;
  return Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000));
}

export function toCheck(node: RawCheckRun | RawStatusContext): Check {
  if (node.__typename === "StatusContext") {
    return {
      name: node.context,
      state: CHECK_STATES[node.state],
      seconds: null,
      url: node.targetUrl,
      required: node.isRequired,
    };
  }
  const conclusion = node.status === "COMPLETED" ? node.conclusion : null;
  return {
    name: node.name,
    state: CHECK_STATES[conclusion ?? node.status],
    seconds: conclusion ? secondsBetween(node.startedAt, node.completedAt) : null,
    url: node.detailsUrl,
    required: node.isRequired,
  };
}

export function toPullRequestDetail(node: RawPullRequestDetail): PullRequestDetail {
  const contexts = node.commits.nodes[0]?.commit.statusCheckRollup?.contexts.nodes ?? [];
  return {
    bodyHtml: node.bodyHTML,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    checks: contexts.map(toCheck),
    files: (node.files?.nodes ?? []).map(({ path, additions, deletions }) => ({
      path,
      additions,
      deletions,
    })),
  };
}
