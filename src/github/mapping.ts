import type {
  Account,
  Check,
  CheckState,
  CiState,
  Mergeability,
  PullRequest,
  PullRequestDetail,
  PullRequestList,
  PullRequestStatus,
  Reviewer,
  ReviewState,
  ReviewVerdict,
  Session,
} from "@/types";

import type {
  CheckConclusionState,
  CheckStatusState,
  MergeableState,
  PullRequestDetailQuery,
  PullRequestReviewDecision,
  PullRequestReviewState,
  PullRequestStatusQuery,
  PullRequestsQuery,
  SessionQuery,
  StatusState,
} from "./graphql.generated";

interface Connection<T> {
  nodes: (T | null)[] | null;
}

export const nodesOf = <T>(connection: Connection<T> | null | undefined): T[] =>
  (connection?.nodes ?? []).filter((node) => node !== null);

type NodeOf<C> = NonNullable<C> extends Connection<infer T> ? T : never;

type PullRequestNode<T> = Extract<
  NonNullable<T>,
  { __typename: "PullRequest" }
>;

export type RawSession = SessionQuery;

type RawAccount = NodeOf<SessionQuery["viewer"]["organizations"]>;

export type RawPullRequestRow = PullRequestNode<
  NodeOf<PullRequestsQuery["search"]>
>;

export type RawPullRequestStatus = PullRequestNode<
  PullRequestStatusQuery["nodes"][number]
>;

export type RawReview = NodeOf<RawPullRequestStatus["latestReviews"]>;

export type RawReviewRequest = NodeOf<RawPullRequestStatus["reviewRequests"]>;

type RawActor = NonNullable<RawPullRequestRow["author"]>;

export type RawPullRequestDetail = PullRequestNode<
  PullRequestDetailQuery["node"]
>;

type RawRollup = NonNullable<
  NodeOf<RawPullRequestDetail["commits"]>["commit"]["statusCheckRollup"]
>;

export type RawCheckContext = NodeOf<RawRollup["contexts"]>;

export interface ReviewContext {
  viewer: string;
  viewerTeams: string[];
}

const GHOST: RawActor = {
  login: "ghost",
  avatarUrl: "https://avatars.githubusercontent.com/u/10137?v=4",
};

const CI_STATES: Record<StatusState, CiState> = {
  SUCCESS: "pass",
  FAILURE: "fail",
  ERROR: "fail",
  PENDING: "pending",
  EXPECTED: "pending",
};

const MERGEABILITY: Record<MergeableState, Mergeability> = {
  MERGEABLE: "clean",
  CONFLICTING: "conflict",
  UNKNOWN: "unknown",
};

const VERDICTS: Partial<Record<PullRequestReviewState, ReviewVerdict>> = {
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes",
  COMMENTED: "comment",
};

const CHECK_STATES: Record<
  CheckStatusState | CheckConclusionState | StatusState,
  CheckState
> = {
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

export const toMergeability = (raw: MergeableState): Mergeability =>
  MERGEABILITY[raw];

export function withMergeability(
  list: PullRequestList,
  states: Record<string, Mergeability>
): PullRequestList {
  return {
    ...list,
    pullRequests: list.pullRequests.map((pr) =>
      pr.id in states ? { ...pr, mergeability: states[pr.id] } : pr
    ),
  };
}

export function toAccount(raw: RawAccount): Account {
  return {
    login: raw.login,
    name: raw.name || raw.login,
    avatarUrl: raw.avatarUrl,
  };
}

export function toSession({ viewer }: RawSession): Session {
  const account = toAccount(viewer);

  const orgs = nodesOf(viewer.organizations)
    .map(toAccount)
    .sort((a, b) => a.login.localeCompare(b.login));

  return { viewer: account, owners: [account, ...orgs] };
}

export function toCi(node: Pick<RawPullRequestStatus, "commits">): CiState {
  const rollup = nodesOf(node.commits)[0]?.commit.statusCheckRollup;

  return rollup ? CI_STATES[rollup.state] : "none";
}

export function toReviewers(
  node: Pick<
    RawPullRequestStatus,
    "author" | "latestReviews" | "latestOpinionatedReviews"
  >
): Reviewer[] {
  const authorLogin = node.author?.login ?? GHOST.login;
  const reviewers = new Map<string, Reviewer>();

  for (const review of [
    ...nodesOf(node.latestReviews),
    ...nodesOf(node.latestOpinionatedReviews),
  ]) {
    const verdict = VERDICTS[review.state];
    const author = review.author ?? GHOST;

    if (!verdict || author.login === authorLogin) {
      continue;
    }

    if (verdict === "comment" && reviewers.has(author.login)) {
      continue;
    }

    reviewers.set(author.login, {
      login: author.login,
      avatarUrl: author.avatarUrl,
      verdict,
    });
  }

  return [...reviewers.values()];
}

export function toReviewState(
  decision: PullRequestReviewDecision | null,
  reviewers: Reviewer[]
): ReviewState {
  const verdicts = new Set(reviewers.map((reviewer) => reviewer.verdict));

  if (decision === "APPROVED") {
    return "approved";
  }

  if (decision === "CHANGES_REQUESTED") {
    return "changes";
  }

  if (decision === "REVIEW_REQUIRED") {
    return verdicts.size > 0 ? "comment" : "none";
  }

  if (verdicts.has("changes")) {
    return "changes";
  }

  if (verdicts.has("approved")) {
    return "approved";
  }

  if (verdicts.has("comment")) {
    return "comment";
  }

  return "none";
}

export function isReviewRequestedFrom(
  node: Pick<RawPullRequestStatus, "reviewRequests">,
  { viewer, viewerTeams }: ReviewContext
): boolean {
  return nodesOf(node.reviewRequests).some(({ requestedReviewer }) => {
    if (requestedReviewer?.__typename === "User") {
      return requestedReviewer.login === viewer;
    }

    if (requestedReviewer?.__typename === "Team") {
      return viewerTeams.includes(requestedReviewer.slug);
    }

    return false;
  });
}

export const PENDING_STATUS: PullRequestStatus = {
  ci: "none",
  mergeability: "unknown",
  review: "none",
  reviewers: [],
  reviewRequestedFromViewer: false,
};

export function toPullRequestRow(node: RawPullRequestRow): PullRequest {
  const author = node.author ?? GHOST;

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
    baseBranch: node.baseRefName,
    isCrossRepository: node.isCrossRepository,
    updatedAt: node.updatedAt,
    ...PENDING_STATUS,
    statusPending: true,
  };
}

export function toPullRequestStatus(
  node: RawPullRequestStatus,
  context: ReviewContext
): PullRequestStatus {
  const reviewers = toReviewers(node);
  const author = node.author?.login ?? GHOST.login;

  return {
    ci: toCi(node),
    mergeability: toMergeability(node.mergeable),
    review: toReviewState(node.reviewDecision, reviewers),
    reviewers,
    reviewRequestedFromViewer:
      author !== context.viewer && isReviewRequestedFrom(node, context),
  };
}

export function withStatus(
  pr: PullRequest,
  status: PullRequestStatus
): PullRequest {
  const { statusPending: _, ...row } = pr;

  return { ...row, ...status };
}

const statusOf = ({
  ci,
  mergeability,
  review,
  reviewers,
  reviewRequestedFromViewer,
}: PullRequestStatus): PullRequestStatus => ({
  ci,
  mergeability,
  review,
  reviewers,
  reviewRequestedFromViewer,
});

export function withRows(
  previous: PullRequestList | undefined,
  rows: PullRequestList
) {
  const known = new Map(
    previous?.pullRequests
      .filter((pr) => !pr.statusPending)
      .map((pr) => [pr.id, pr])
  );

  return {
    ...rows,
    pullRequests: rows.pullRequests.map((row) => {
      const previousPr = known.get(row.id);

      return previousPr ? withStatus(row, statusOf(previousPr)) : row;
    }),
  };
}

function secondsBetween(
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }

  return Math.max(
    0,
    Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000)
  );
}

export function toCheck(node: RawCheckContext): Check {
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
    seconds: conclusion
      ? secondsBetween(node.startedAt, node.completedAt)
      : null,
    url: node.detailsUrl,
    required: node.isRequired,
  };
}

export function toPullRequestDetail(
  node: RawPullRequestDetail
): PullRequestDetail {
  const contexts = nodesOf(
    nodesOf(node.commits)[0]?.commit.statusCheckRollup?.contexts
  );

  return {
    bodyHtml: node.bodyHTML,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    checks: contexts.map(toCheck),
    files: nodesOf(node.files).map(({ path, additions, deletions }) => ({
      path,
      additions,
      deletions,
    })),
  };
}
