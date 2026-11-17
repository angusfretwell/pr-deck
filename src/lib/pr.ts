import type { CheckState, CiState, PullRequest, ReviewState } from "../types";

export type Tone = "ok" | "bad" | "severe" | "warn" | "mute";
export type BadgeIconName =
  | "pass"
  | "fail"
  | "failOutline"
  | "pending"
  | "ring"
  | "open"
  | "check"
  | "review"
  | "chat"
  | "alert";

export interface Badge {
  tone: Tone;
  icon: BadgeIconName;
  label: string;
}

const PASS: Badge = { tone: "ok", icon: "pass", label: "Passing" };
const FAIL: Badge = { tone: "bad", icon: "fail", label: "Failing" };
const PENDING: Badge = { tone: "warn", icon: "pending", label: "Running" };

export const CI_BADGE: Record<CiState, Badge> = {
  pass: PASS,
  fail: FAIL,
  pending: PENDING,
  none: { tone: "mute", icon: "ring", label: "No checks" },
};

export const CHECK_BADGE: Record<CheckState, Badge> = {
  pass: PASS,
  fail: FAIL,
  pending: PENDING,
  skipped: { tone: "mute", icon: "ring", label: "Skipped" },
};

export const REVIEW_BADGE: Record<ReviewState, Badge> = {
  none: { tone: "mute", icon: "ring", label: "No reviews" },
  comment: { tone: "mute", icon: "chat", label: "Commented" },
  changes: { tone: "bad", icon: "review", label: "Changes requested" },
  approved: { tone: "ok", icon: "check", label: "Approved" },
};

export const CONFLICT_BADGE: Badge = { tone: "severe", icon: "alert", label: "Conflicts" };

export type ViewerReviewState = ReviewState | "requested";

export function viewerReview(pr: PullRequest, viewer: string): ViewerReviewState {
  if (pr.reviewRequestedFromViewer) return "requested";
  return pr.reviewers.find((reviewer) => reviewer.login === viewer)?.verdict ?? "none";
}

export function issueBadges(pr: PullRequest): Badge[] {
  const badges: Badge[] = [];
  if (pr.ci === "fail") badges.push({ ...FAIL, icon: "failOutline", label: "Checks" });
  if (pr.ci === "pending") badges.push({ ...PENDING, label: "Checks" });
  if (pr.mergeability === "conflict") badges.push(CONFLICT_BADGE);
  if (pr.review === "changes" || pr.review === "approved") badges.push(REVIEW_BADGE[pr.review]);
  return badges;
}

export function statusBadge(pr: PullRequest): Badge {
  const blockers = [
    pr.ci === "fail" && "Checks failing",
    pr.mergeability === "conflict" && "Conflicts",
    pr.review === "changes" && "Changes requested",
  ].filter((label) => label !== false);
  if (blockers.length)
    return {
      tone: blockers.length === 1 && pr.mergeability === "conflict" ? "severe" : "bad",
      icon: "fail",
      label: blockers.join(", "),
    };
  if (pr.ci === "pending") return { ...PENDING, label: "Checks running" };
  if (pr.review === "approved" && pr.ci === "pass" && pr.mergeability === "clean")
    return { tone: "ok", icon: "pass", label: "Ready to merge" };
  return { tone: "mute", icon: "open", label: "Awaiting review" };
}

const HOUR_MS = 3_600_000;
const STALE_AFTER_HOURS = 120;

const hoursSince = (updatedAt: string, now: number) =>
  Math.max(0, (now - Date.parse(updatedAt)) / HOUR_MS);

export function age(updatedAt: string, now = Date.now()) {
  const hours = Math.floor(hoursSince(updatedAt, now));
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export const isStale = (updatedAt: string, now = Date.now()) =>
  hoursSince(updatedAt, now) > STALE_AFTER_HOURS;
