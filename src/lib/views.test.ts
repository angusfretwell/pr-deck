import { describe, expect, it } from "vite-plus/test";
import type { PullRequest } from "../types";
import { passes } from "./filters";
import { findViewBySlug, seedViews, slugify, uniqueName } from "./views";

const pr = (overrides: Partial<PullRequest> = {}): PullRequest => ({
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
  updatedAt: "2026-01-01T00:00:00Z",
  ci: "pass",
  mergeability: "clean",
  review: "none",
  reviewers: [],
  reviewRequestedFromViewer: false,
  ...overrides,
});

const view = (id: string, name: string) => ({ id, name, filters: [] });

describe("slugify", () => {
  it("lowercases and collapses separators", () => {
    expect(slugify("  Needs my review!! ")).toBe("needs-my-review");
    expect(slugify("A -- B")).toBe("a-b");
  });

  it("falls back to view", () => {
    expect(slugify("!!!")).toBe("view");
    expect(slugify("")).toBe("view");
  });
});

describe("findViewBySlug", () => {
  it("finds by slugified name", () => {
    const views = [view("1", "Mine"), view("2", "Needs my review")];
    expect(findViewBySlug(views, "needs-my-review")?.id).toBe("2");
    expect(findViewBySlug(views, "missing")).toBeUndefined();
  });
});

describe("uniqueName", () => {
  const views = [view("1", "Mine"), view("2", "Mine 2")];

  it("keeps a free name", () => {
    expect(uniqueName(views, "  Other ")).toBe("Other");
  });

  it("names empty input", () => {
    expect(uniqueName(views, "   ")).toBe("Untitled view");
  });

  it("appends the first free number", () => {
    expect(uniqueName(views, "mine")).toBe("mine 3");
  });

  it("treats names with the same slug as taken", () => {
    expect(uniqueName(views, "MINE!")).toBe("MINE! 3");
  });

  it("ignores the excepted view", () => {
    expect(uniqueName(views, "Mine", "1")).toBe("Mine");
  });
});

describe("seedViews", () => {
  const byName = (name: string) => seedViews().find((v) => v.name === name)!;
  const select = (name: string, ...prs: ReturnType<typeof pr>[]) =>
    prs.filter((p) => passes(p, byName(name).filters, "me")).map((p) => p.id);

  it("creates unique ids", () => {
    const ids = seedViews().map((v) => v.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("Mine selects the viewer's PRs", () => {
    expect(select("Mine", pr({ id: "a", author: "me" }), pr({ id: "b", author: "bob" }))).toEqual([
      "a",
    ]);
  });

  it("Needs my review selects requested PRs", () => {
    expect(
      select("Needs my review", pr({ id: "a", reviewRequestedFromViewer: true }), pr({ id: "b" })),
    ).toEqual(["a"]);
  });

  it("Ready to merge selects approved, passing, clean PRs", () => {
    expect(
      select(
        "Ready to merge",
        pr({ id: "a", review: "approved" }),
        pr({ id: "b", review: "approved", ci: "fail" }),
        pr({ id: "c", review: "approved", mergeability: "conflict" }),
        pr({ id: "d", review: "comment" }),
      ),
    ).toEqual(["a"]);
  });
});
