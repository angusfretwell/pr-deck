export type CiState = "pass" | "fail" | "pending" | "none";
export type CheckState = "pass" | "fail" | "pending" | "skipped";
export type Mergeability = "clean" | "conflict" | "unknown";
export type ReviewVerdict = "comment" | "changes" | "approved";
export type ReviewState = ReviewVerdict | "none";

export interface Account {
  login: string;
  name: string;
  avatarUrl: string;
}

export interface Session {
  viewer: Account;
  owners: Account[];
}

export interface Reviewer {
  login: string;
  avatarUrl: string;
  verdict: ReviewVerdict;
}

export interface PullRequest {
  id: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  author: string;
  authorAvatarUrl: string;
  isDraft: boolean;
  branch: string;
  updatedAt: string;
  ci: CiState;
  mergeability: Mergeability;
  review: ReviewState;
  reviewers: Reviewer[];
  reviewRequestedFromViewer: boolean;
}

export interface PullRequestList {
  pullRequests: PullRequest[];
  totalCount: number;
}

export interface Check {
  name: string;
  state: CheckState;
  seconds: number | null;
  url: string | null;
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
}

export interface PullRequestDetail {
  bodyHtml: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  checks: Check[];
  files: FileChange[];
}

export type PropertyKey = "author" | "ci" | "conflicts" | "review" | "myReview" | "repo";
export type Group = "repo" | "author" | "none";

export interface Filter {
  key: PropertyKey;
  values: string[];
  negated: boolean;
}

export interface View {
  id: string;
  name: string;
  filters: Filter[];
  isDefault?: boolean;
}
