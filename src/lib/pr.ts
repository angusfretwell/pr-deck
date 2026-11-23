import type { CheckState, CiState, PullRequest, ReviewState } from "../types";

export type Tone = "ok" | "bad" | "severe" | "warn" | "mute";

export type BadgeIconName =
  | "pass"
  | "fail"
  | "pending"
  | "ring"
  | "open"
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
  approved: { tone: "ok", icon: "pass", label: "Approved" },
};

export const CONFLICT_BADGE: Badge = {
  tone: "severe",
  icon: "alert",
  label: "Conflicts",
};

export type ViewerReviewState = ReviewState | "requested";

export const viewerReview = (pr: PullRequest, viewer: string) => {
  if (pr.reviewRequestedFromViewer) {
    return "requested";
  }

  return (pr.reviewers.find((reviewer) => reviewer.login === viewer)?.verdict ??
    "none") satisfies ViewerReviewState;
};

export const issueBadges = (pr: PullRequest) => {
  const badges: Badge[] = [];

  if (pr.ci === "fail") {
    badges.push({ ...FAIL, label: "Checks" });
  }

  if (pr.ci === "pending") {
    badges.push({ ...PENDING, label: "Checks" });
  }

  if (pr.mergeability === "conflict") {
    badges.push(CONFLICT_BADGE);
  }

  if (pr.review === "changes" || pr.review === "approved") {
    badges.push(REVIEW_BADGE[pr.review]);
  }

  return badges;
};

export const statusBadge = (pr: PullRequest) => {
  const blockers = [
    pr.ci === "fail" && "Checks failing",
    pr.mergeability === "conflict" && "Conflicts",
    pr.review === "changes" && "Changes requested",
  ].filter((label) => label !== false);

  if (blockers.length) {
    return {
      tone:
        blockers.length === 1 && pr.mergeability === "conflict"
          ? "severe"
          : "bad",
      icon: "fail",
      label: blockers.join(", "),
    } satisfies Badge;
  }

  if (pr.ci === "pending") {
    return { ...PENDING, label: "Checks running" } satisfies Badge;
  }

  if (
    pr.review === "approved" &&
    pr.ci === "pass" &&
    pr.mergeability === "clean"
  ) {
    return {
      tone: "ok",
      icon: "pass",
      label: "Ready to merge",
    } satisfies Badge;
  }

  return {
    tone: "mute",
    icon: "open",
    label: "Awaiting review",
  } satisfies Badge;
};

const HOUR_MS = 3_600_000;
const STALE_AFTER_HOURS = 120;

const hoursSince = (updatedAt: string, now: number) =>
  Math.max(0, (now - Date.parse(updatedAt)) / HOUR_MS);

export const age = (updatedAt: string, now = Date.now()) => {
  const hours = Math.floor(hoursSince(updatedAt, now));

  if (hours < 1) {
    return "now";
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.round(hours / 24)}d`;
};

export const isStale = (updatedAt: string, now = Date.now()) =>
  hoursSince(updatedAt, now) > STALE_AFTER_HOURS;
