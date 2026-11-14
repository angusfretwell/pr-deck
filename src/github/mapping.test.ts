import { describe, expect, it } from "vite-plus/test";
import {
  toCheck,
  toPullRequest,
  toPullRequestDetail,
  toSession,
  type RawCheckConclusion,
  type RawCheckRunStatus,
  type RawPullRequest,
  type RawReview,
  type RawRollupState,
} from "./mapping";

const context = { viewer: "me", viewerTeams: ["core"] };

const actor = (login: string) => ({ login, avatarUrl: `https://avatars/${login}` });
const review = (login: string, state: RawReview["state"]): RawReview => ({
  state,
  author: actor(login),
});

const rawPullRequest = (overrides: Partial<RawPullRequest> = {}): RawPullRequest => ({
  id: "PR_1",
  number: 7,
  title: "Add things",
  url: "https://github.com/acme/web/pull/7",
  isDraft: false,
  updatedAt: "2026-11-01T00:00:00Z",
  headRefName: "feature",
  mergeable: "MERGEABLE",
  reviewDecision: null,
  repository: { name: "web", owner: { login: "acme" } },
  author: actor("alice"),
  commits: { nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS" } } }] },
  latestReviews: { nodes: [] },
  latestOpinionatedReviews: { nodes: [] },
  reviewRequests: { nodes: [] },
  ...overrides,
});

const map = (overrides: Partial<RawPullRequest>) =>
  toPullRequest(rawPullRequest(overrides), context);

const withRollup = (state: RawRollupState | null) => ({
  commits: { nodes: [{ commit: { statusCheckRollup: state ? { state } : null } }] },
});

describe("toPullRequest", () => {
  it("maps the basic fields", () => {
    expect(map({})).toEqual({
      id: "PR_1",
      owner: "acme",
      repo: "web",
      number: 7,
      title: "Add things",
      url: "https://github.com/acme/web/pull/7",
      author: "alice",
      authorAvatarUrl: "https://avatars/alice",
      isDraft: false,
      branch: "feature",
      updatedAt: "2026-11-01T00:00:00Z",
      ci: "pass",
      mergeability: "clean",
      review: "none",
      reviewers: [],
      reviewRequestedFromViewer: false,
    });
  });

  it.each([
    ["SUCCESS", "pass"],
    ["FAILURE", "fail"],
    ["ERROR", "fail"],
    ["PENDING", "pending"],
    ["EXPECTED", "pending"],
  ] as const)("maps rollup %s to ci %s", (state, ci) => {
    expect(map(withRollup(state)).ci).toBe(ci);
  });

  it("maps a missing rollup or missing commit to ci none", () => {
    expect(map(withRollup(null)).ci).toBe("none");
    expect(map({ commits: { nodes: [] } }).ci).toBe("none");
  });

  it.each([
    ["MERGEABLE", "clean"],
    ["CONFLICTING", "conflict"],
    ["UNKNOWN", "unknown"],
  ] as const)("maps mergeable %s to %s", (mergeable, mergeability) => {
    expect(map({ mergeable }).mergeability).toBe(mergeability);
  });

  it("maps a deleted author to ghost", () => {
    const pullRequest = map({ author: null });
    expect(pullRequest.author).toBe("ghost");
    expect(pullRequest.authorAvatarUrl).toContain("/u/10137");
  });
});

describe("reviewers", () => {
  it("uses each reviewer's latest review and excludes the author", () => {
    const pullRequest = map({
      latestReviews: {
        nodes: [
          review("bob", "COMMENTED"),
          review("alice", "COMMENTED"),
          review("carol", "APPROVED"),
        ],
      },
      latestOpinionatedReviews: {
        nodes: [review("carol", "APPROVED"), review("alice", "APPROVED")],
      },
    });
    expect(pullRequest.reviewers).toEqual([
      { login: "bob", avatarUrl: "https://avatars/bob", verdict: "comment" },
      { login: "carol", avatarUrl: "https://avatars/carol", verdict: "approved" },
    ]);
  });

  it("keeps an earlier approval or change request when a later review is a plain comment", () => {
    const pullRequest = map({
      latestReviews: { nodes: [review("bob", "COMMENTED"), review("carol", "COMMENTED")] },
      latestOpinionatedReviews: {
        nodes: [review("bob", "APPROVED"), review("carol", "CHANGES_REQUESTED")],
      },
    });
    expect(pullRequest.reviewers.map((reviewer) => [reviewer.login, reviewer.verdict])).toEqual([
      ["bob", "approved"],
      ["carol", "changes"],
    ]);
  });

  it("ignores dismissed and pending reviews", () => {
    const pullRequest = map({
      latestReviews: { nodes: [review("bob", "DISMISSED"), review("carol", "PENDING")] },
    });
    expect(pullRequest.reviewers).toEqual([]);
  });
});

describe("overall review", () => {
  const approvedBy = { latestOpinionatedReviews: { nodes: [review("bob", "APPROVED")] } };
  const commentedBy = { latestReviews: { nodes: [review("bob", "COMMENTED")] } };

  it("uses reviewDecision when GitHub gives one", () => {
    expect(map({ reviewDecision: "APPROVED" }).review).toBe("approved");
    expect(map({ reviewDecision: "CHANGES_REQUESTED" }).review).toBe("changes");
    expect(map({ reviewDecision: "REVIEW_REQUIRED" }).review).toBe("none");
    expect(map({ reviewDecision: "REVIEW_REQUIRED", ...commentedBy }).review).toBe("comment");
    expect(map({ reviewDecision: "REVIEW_REQUIRED", ...approvedBy }).review).toBe("comment");
  });

  it("derives from reviewers when reviewDecision is null", () => {
    expect(map({}).review).toBe("none");
    expect(map(commentedBy).review).toBe("comment");
    expect(map(approvedBy).review).toBe("approved");
    expect(
      map({
        latestOpinionatedReviews: {
          nodes: [review("bob", "APPROVED"), review("carol", "CHANGES_REQUESTED")],
        },
      }).review,
    ).toBe("changes");
  });
});

describe("reviewRequestedFromViewer", () => {
  const requests = (
    ...requestedReviewers: RawPullRequest["reviewRequests"]["nodes"][number]["requestedReviewer"][]
  ) => ({
    reviewRequests: {
      nodes: requestedReviewers.map((requestedReviewer) => ({ requestedReviewer })),
    },
  });

  it("is true for a direct request", () => {
    expect(map(requests({ __typename: "User", login: "me" })).reviewRequestedFromViewer).toBe(true);
  });

  it("is true for a request to one of the viewer's teams", () => {
    expect(map(requests({ __typename: "Team", slug: "core" })).reviewRequestedFromViewer).toBe(
      true,
    );
  });

  it("is false for a request to another team or user", () => {
    expect(
      map(requests({ __typename: "Team", slug: "design" }, { __typename: "User", login: "bob" }))
        .reviewRequestedFromViewer,
    ).toBe(false);
  });

  it("is false on the viewer's own pull request", () => {
    expect(
      map({ author: actor("me"), ...requests({ __typename: "Team", slug: "core" }) })
        .reviewRequestedFromViewer,
    ).toBe(false);
  });

  it("is false with no requests", () => {
    expect(map(requests()).reviewRequestedFromViewer).toBe(false);
    expect(map(requests(null)).reviewRequestedFromViewer).toBe(false);
  });
});

describe("toSession", () => {
  it("puts the viewer first, then orgs by login, falling back to login for names", () => {
    const session = toSession({
      viewer: {
        login: "me",
        name: null,
        avatarUrl: "a",
        organizations: {
          nodes: [
            { login: "zeta", name: "Zeta", avatarUrl: "z" },
            null,
            { login: "alpha", name: "", avatarUrl: "x" },
          ],
        },
      },
    });
    expect(session.viewer).toEqual({ login: "me", name: "me", avatarUrl: "a" });
    expect(session.owners.map((owner) => [owner.login, owner.name])).toEqual([
      ["me", "me"],
      ["alpha", "alpha"],
      ["zeta", "Zeta"],
    ]);
  });
});

describe("toCheck", () => {
  const checkRun = (
    status: RawCheckRunStatus,
    conclusion: RawCheckConclusion | null,
    startedAt: string | null = null,
    completedAt: string | null = null,
  ) =>
    toCheck({
      __typename: "CheckRun",
      name: "build",
      status,
      conclusion,
      startedAt,
      completedAt,
      detailsUrl: "https://ci/build",
    });

  it.each([
    ["SUCCESS", "pass"],
    ["FAILURE", "fail"],
    ["TIMED_OUT", "fail"],
    ["CANCELLED", "fail"],
    ["ACTION_REQUIRED", "fail"],
    ["STARTUP_FAILURE", "fail"],
    ["SKIPPED", "skipped"],
    ["NEUTRAL", "skipped"],
    ["STALE", "skipped"],
  ] as const)("maps a completed check run concluding %s to %s", (conclusion, state) => {
    expect(checkRun("COMPLETED", conclusion).state).toBe(state);
  });

  it.each(["QUEUED", "IN_PROGRESS", "PENDING", "WAITING", "REQUESTED"] as const)(
    "maps a %s check run to pending",
    (status) => {
      expect(checkRun(status, null).state).toBe("pending");
    },
  );

  it("measures a finished run and leaves a running one unknown", () => {
    expect(
      checkRun("COMPLETED", "SUCCESS", "2026-11-01T00:00:00Z", "2026-11-01T00:01:30Z"),
    ).toEqual({
      name: "build",
      state: "pass",
      seconds: 90,
      url: "https://ci/build",
    });
    expect(checkRun("IN_PROGRESS", null, "2026-11-01T00:00:00Z").seconds).toBeNull();
  });

  it("clamps skipped runs that GitHub reports as starting after they completed", () => {
    expect(
      checkRun("COMPLETED", "SKIPPED", "2026-11-01T00:00:10Z", "2026-11-01T00:00:00Z").seconds,
    ).toBe(0);
  });

  it.each([
    ["SUCCESS", "pass"],
    ["FAILURE", "fail"],
    ["ERROR", "fail"],
    ["PENDING", "pending"],
    ["EXPECTED", "pending"],
  ] as const)("maps a status context %s to %s", (state, expected) => {
    expect(
      toCheck({ __typename: "StatusContext", context: "vercel", state, targetUrl: null }),
    ).toEqual({
      name: "vercel",
      state: expected,
      seconds: null,
      url: null,
    });
  });
});

describe("toPullRequestDetail", () => {
  const stats = { additions: 10, deletions: 2, changedFiles: 3 };

  it("maps the body, checks and files", () => {
    const detail = toPullRequestDetail({
      ...stats,
      bodyHTML: "<p>Hello</p>",
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                contexts: {
                  nodes: [
                    {
                      __typename: "CheckRun",
                      name: "test",
                      status: "COMPLETED",
                      conclusion: "FAILURE",
                      startedAt: "2026-11-01T00:00:00Z",
                      completedAt: "2026-11-01T00:00:05Z",
                      detailsUrl: "https://ci/test",
                    },
                    {
                      __typename: "StatusContext",
                      context: "deploy",
                      state: "SUCCESS",
                      targetUrl: "https://deploy",
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      files: { nodes: [{ path: "src/a.ts", additions: 4, deletions: 1 }] },
    });
    expect(detail).toEqual({
      ...stats,
      bodyHtml: "<p>Hello</p>",
      checks: [
        { name: "test", state: "fail", seconds: 5, url: "https://ci/test" },
        { name: "deploy", state: "pass", seconds: null, url: "https://deploy" },
      ],
      files: [{ path: "src/a.ts", additions: 4, deletions: 1 }],
    });
  });

  it("handles no rollup and no files", () => {
    expect(
      toPullRequestDetail({ ...stats, bodyHTML: "", commits: { nodes: [] }, files: null }),
    ).toEqual({
      ...stats,
      bodyHtml: "",
      checks: [],
      files: [],
    });
  });
});
