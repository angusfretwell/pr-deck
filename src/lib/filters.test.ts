import { describe, expect, it } from "vite-plus/test";

import type { Filter, PullRequest } from "../types";
import {
  awaitsStatus,
  matchesText,
  passes,
  PROPERTY,
  sameFilters,
  toggleValue,
} from "./filters";

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

const is = (key: Filter["key"], ...values: string[]) => ({
  key,
  values,
  negated: false,
});

const isNot = (key: Filter["key"], ...values: string[]) => ({
  key,
  values,
  negated: true,
});

describe("passes", () => {
  it("passes everything with no filters", () => {
    expect(passes(pr(), [], "me")).toBe(true);
  });

  it("matches any of several values", () => {
    const filters = [is("ci", "pass", "fail")];
    expect(passes(pr({ ci: "fail" }), filters, "me")).toBe(true);
    expect(passes(pr({ ci: "pending" }), filters, "me")).toBe(false);
  });

  it("requires every filter", () => {
    const filters = [is("ci", "pass"), is("repo", "api")];
    expect(passes(pr({ repo: "web" }), filters, "me")).toBe(false);
    expect(passes(pr({ repo: "api" }), filters, "me")).toBe(true);
  });

  it("negates", () => {
    expect(passes(pr({ repo: "web" }), [isNot("repo", "web")], "me")).toBe(
      false
    );
    expect(passes(pr({ repo: "api" }), [isNot("repo", "web")], "me")).toBe(
      true
    );
  });

  it("resolves @me for the author", () => {
    expect(passes(pr({ author: "me" }), [is("author", "@me")], "me")).toBe(
      true
    );
    expect(passes(pr({ author: "bob" }), [is("author", "@me")], "me")).toBe(
      false
    );
    expect(passes(pr({ author: "bob" }), [is("author", "bob")], "me")).toBe(
      true
    );
  });

  it("distinguishes requested, reviewed and none for myReview", () => {
    const mine = { login: "me", avatarUrl: "", verdict: "comment" as const };
    const requested = pr({ reviewRequestedFromViewer: true });
    const reviewed = pr({ reviewers: [mine] });
    const untouched = pr();
    expect(passes(requested, [is("myReview", "requested")], "me")).toBe(true);
    expect(passes(reviewed, [is("myReview", "requested")], "me")).toBe(false);
    expect(passes(reviewed, [is("myReview", "comment")], "me")).toBe(true);
    expect(passes(untouched, [is("myReview", "none")], "me")).toBe(true);
    expect(passes(requested, [is("myReview", "none")], "me")).toBe(false);
  });

  it("matches CI none", () => {
    expect(passes(pr({ ci: "none" }), [is("ci", "none")], "me")).toBe(true);
    expect(passes(pr({ ci: "pass" }), [is("ci", "none")], "me")).toBe(false);
  });

  it("matches unknown mergeability", () => {
    expect(
      passes(
        pr({ mergeability: "unknown" }),
        [is("conflicts", "unknown")],
        "me"
      )
    ).toBe(true);
    expect(
      passes(pr({ mergeability: "unknown" }), [is("conflicts", "clean")], "me")
    ).toBe(false);
  });
});

describe("property options", () => {
  it("lists No checks for CI", () => {
    expect(PROPERTY.ci.options([], "me").map((o) => o.label)).toEqual([
      "Passing",
      "Failing",
      "Running",
      "No checks",
    ]);
  });

  it("lists Review requested first for My review", () => {
    expect(PROPERTY.myReview.options([], "me").map((o) => o.value)).toEqual([
      "requested",
      "none",
      "comment",
      "changes",
      "approved",
    ]);
  });

  it("lists Me then other authors", () => {
    const prs = [
      pr({ author: "me" }),
      pr({ author: "zed" }),
      pr({ author: "bob" }),
    ];

    expect(PROPERTY.author.options(prs, "me").map((o) => o.value)).toEqual([
      "@me",
      "bob",
      "zed",
    ]);
  });
});

describe("toggleValue", () => {
  it("adds a filter", () => {
    expect(toggleValue([], "ci", "pass")).toEqual([is("ci", "pass")]);
  });

  it("adds a second value", () => {
    expect(toggleValue([is("ci", "pass")], "ci", "fail")).toEqual([
      is("ci", "pass", "fail"),
    ]);
  });

  it("removes a value", () => {
    expect(toggleValue([is("ci", "pass", "fail")], "ci", "pass")).toEqual([
      is("ci", "fail"),
    ]);
  });

  it("adds a negated filter", () => {
    expect(toggleValue([], "ci", "pass", true)).toEqual([isNot("ci", "pass")]);
  });

  it("drops the filter when the last value is removed", () => {
    expect(
      toggleValue([is("ci", "pass"), is("repo", "web")], "ci", "pass")
    ).toEqual([is("repo", "web")]);
  });
});

describe("sameFilters", () => {
  it("ignores filter and value order", () => {
    const a = [is("ci", "pass", "fail"), is("repo", "web")];
    const b = [is("repo", "web"), is("ci", "fail", "pass")];
    expect(sameFilters(a, b)).toBe(true);
  });

  it("respects negation", () => {
    expect(sameFilters([is("ci", "pass")], [isNot("ci", "pass")])).toBe(false);
  });

  it("respects values and length", () => {
    expect(sameFilters([is("ci", "pass")], [is("ci", "fail")])).toBe(false);
    expect(sameFilters([is("ci", "pass")], [])).toBe(false);
  });
});

describe("matchesText", () => {
  const target = pr({
    title: "Fix login",
    repo: "web",
    number: 42,
    author: "alice",
  });

  it("matches title, repo, number and author", () => {
    expect(matchesText(target, "login")).toBe(true);
    expect(matchesText(target, "WEB")).toBe(true);
    expect(matchesText(target, "#42")).toBe(true);
    expect(matchesText(target, "alice")).toBe(true);
  });

  it("matches everything when blank", () => {
    expect(matchesText(target, "  ")).toBe(true);
  });

  it("rejects non-matches", () => {
    expect(matchesText(target, "nope")).toBe(false);
  });
});

describe("awaitsStatus", () => {
  const pending = pr({ statusPending: true });

  it("waits while a status filter has pending pull requests to judge", () => {
    expect(awaitsStatus([is("ci", "pass")], [pr(), pending])).toBe(true);
    expect(awaitsStatus([is("myReview", "requested")], [pending])).toBe(true);
  });

  it("does not wait on row filters or once every status has loaded", () => {
    expect(
      awaitsStatus([is("author", "me"), is("repo", "web")], [pending])
    ).toBe(false);
    expect(awaitsStatus([is("ci", "pass")], [pr()])).toBe(false);
    expect(awaitsStatus([], [pending])).toBe(false);
  });
});
