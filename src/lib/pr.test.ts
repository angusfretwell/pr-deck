import { describe, expect, it } from "vite-plus/test";

import type { PullRequest } from "../types";
import {
  age,
  CI_BADGE,
  CHECK_BADGE,
  isStale,
  issueBadges,
  statusBadge,
  viewerReview,
} from "./pr";

const pr = (overrides: Partial<PullRequest> = {}) =>
  ({
    id: "1",
    owner: "acme",
    repo: "web",
    number: 1,
    title: "Title",
    url: "https://github.com/acme/web/pull/1",
    author: "alice",
    authorAvatarUrl: "",
    isDraft: false,
    branch: "feature",
    baseBranch: "main",
    isCrossRepository: false,
    updatedAt: "2026-01-01T00:00:00Z",
    ci: "pass",
    mergeability: "clean",
    review: "none",
    reviewers: [],
    reviewRequestedFromViewer: false,
    ...overrides,
  }) satisfies PullRequest;

const status = (overrides: Partial<PullRequest>) => {
  const { tone, icon, label } = statusBadge(pr(overrides));

  return [tone, icon, label];
};

const labels = (overrides: Partial<PullRequest>) =>
  issueBadges(pr(overrides)).map((badge) => [badge.tone, badge.label]);

describe("badge tables", () => {
  it("labels the none and skipped states", () => {
    expect(CI_BADGE.none).toMatchObject({
      tone: "mute",
      icon: "ring",
      label: "No checks",
    });
    expect(CHECK_BADGE.skipped).toMatchObject({
      tone: "mute",
      icon: "ring",
      label: "Skipped",
    });
  });
});

describe("viewerReview", () => {
  const reviewers = [
    { login: "me", avatarUrl: "", verdict: "approved" as const },
  ];

  it("prefers a pending request", () => {
    expect(
      viewerReview(pr({ reviewers, reviewRequestedFromViewer: true }), "me")
    ).toBe("requested");
  });

  it("returns the viewer's verdict", () => {
    expect(viewerReview(pr({ reviewers }), "me")).toBe("approved");
  });

  it("returns none without a verdict", () => {
    expect(viewerReview(pr({ reviewers }), "someone")).toBe("none");
  });
});

describe("statusBadge", () => {
  it("lists every blocker under one failing icon", () => {
    expect(
      status({ ci: "fail", mergeability: "conflict", review: "changes" })
    ).toEqual(["bad", "fail", "Checks failing, Conflicts, Changes requested"]);
  });

  it("puts blockers ahead of running checks", () => {
    expect(status({ ci: "pending", review: "changes" })).toEqual([
      "bad",
      "fail",
      "Changes requested",
    ]);
    expect(status({ ci: "pending" })).toEqual([
      "warn",
      "pending",
      "Checks running",
    ]);
  });

  it("is ready only when approved, passing and clean", () => {
    expect(status({ review: "approved" })).toEqual([
      "ok",
      "pass",
      "Ready to merge",
    ]);
    expect(status({ review: "approved", mergeability: "unknown" })).toEqual([
      "mute",
      "open",
      "Awaiting review",
    ]);
  });
});

describe("issueBadges", () => {
  it("flags failing and running checks", () => {
    expect(labels({ ci: "fail" })).toEqual([["bad", "Checks"]]);
    expect(labels({ ci: "pending" })).toEqual([["warn", "Checks"]]);
  });

  it("shows no CI badge for none", () => {
    expect(labels({ ci: "none" })).toEqual([]);
  });

  it("flags conflicts but not unknown mergeability", () => {
    expect(labels({ mergeability: "conflict" })).toEqual([
      ["severe", "Conflicts"],
    ]);
    expect(labels({ mergeability: "unknown" })).toEqual([]);
  });

  it("flags requested changes", () => {
    expect(labels({ review: "changes" })).toEqual([
      ["bad", "Changes requested"],
    ]);
  });

  it("combines issues in order", () => {
    expect(
      labels({ ci: "fail", mergeability: "conflict", review: "changes" })
    ).toEqual([
      ["bad", "Checks"],
      ["severe", "Conflicts"],
      ["bad", "Changes requested"],
    ]);
  });

  it("shows Approved whenever the PR is approved", () => {
    expect(labels({ review: "approved" })).toEqual([["ok", "Approved"]]);
    expect(labels({ review: "approved", ci: "fail" })).toEqual([
      ["bad", "Checks"],
      ["ok", "Approved"],
    ]);
    expect(labels({ review: "comment" })).toEqual([]);
  });
});

describe("age and isStale", () => {
  const now = Date.parse("2026-01-10T00:00:00Z");

  const ago = (hours: number) =>
    new Date(now - hours * 3_600_000).toISOString();

  it("formats age", () => {
    expect(age(ago(0.5), now)).toBe("now");
    expect(age(ago(5), now)).toBe("5h");
    expect(age(ago(23), now)).toBe("23h");
    expect(age(ago(72), now)).toBe("3d");
  });

  it("is stale after 120 hours", () => {
    expect(isStale(ago(120), now)).toBe(false);
    expect(isStale(ago(121), now)).toBe(true);
  });
});
