import { describe, expect, it } from "vite-plus/test";

import type { Filter, PullRequest, View } from "../types";
import { countByView, openViews } from "./views";
import type { ViewsChange, ViewsSession } from "./views";

const OWNER = "acme";

const pr = (overrides: Partial<PullRequest> = {}) =>
  ({
    id: "1",
    owner: OWNER,
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

const is = (key: Filter["key"], ...values: string[]) =>
  ({
    key,
    values,
    negated: false,
  }) satisfies Filter;

const view = (id: string, name: string, filters: Filter[] = []) =>
  ({
    id,
    name,
    filters,
  }) satisfies View;

const STORED = [
  view("1", "Mine"),
  view("2", "Needs my review", [is("ci", "fail")]),
];

const open = (
  slug: string | null,
  stored: View[] = STORED,
  session?: ViewsSession
) => openViews({ owner: OWNER, stored, slug, session });

const seed = () =>
  openViews({ owner: OWNER, stored: undefined, slug: null }).list;

const slugOf = (path: string) => path.split("/")[2] ?? null;

const follow = (change: ViewsChange, slug: string | null) =>
  open(
    change.navigate ? slugOf(change.navigate.to) : slug,
    change.views,
    change.session
  );

const names = (views: View[]) => views.map((v) => v.name);

describe("seeding", () => {
  const seeded = seed();

  it("seeds three default views with unique ids for a new owner", () => {
    expect(names(seeded)).toEqual([
      "Mine",
      "Needs my review",
      "Ready to merge",
    ]);
    expect(new Set(seeded.map((v) => v.id)).size).toBe(3);
    expect(seeded.every((v) => v.isDefault === true)).toBe(true);
  });

  it("keeps stored views as they are, including an empty collection", () => {
    expect(open(null).list).toBe(STORED);
    const none: View[] = [];
    expect(open(null, none).list).toBe(none);
  });

  it("marks unmarked views that still match a default", () => {
    const legacy = seeded.map((v) => ({ ...v, isDefault: undefined }));
    const stored = [...legacy, view("x", "Custom")];
    expect(open(null, stored).list.map((v) => v.isDefault === true)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it("leaves renamed or refiltered defaults unmarked", () => {
    const [mine, review] = seeded.map((v) => ({ ...v, isDefault: undefined }));

    const stored = [
      { ...mine, name: "Mine!" },
      { ...review, filters: [] },
    ];

    expect(open(null, stored).list).toBe(stored);
  });
});

describe("countByView", () => {
  const seeded = seed();

  const count = (name: string, ...prs: PullRequest[]) =>
    countByView(seeded, prs, "me")[
      seeded.find((v) => v.name === name)?.id ?? ""
    ];

  it("Mine counts the viewer's PRs", () => {
    expect(count("Mine", pr({ author: "me" }), pr({ author: "bob" }))).toBe(1);
  });

  it("Needs my review counts requested PRs", () => {
    expect(
      count("Needs my review", pr({ reviewRequestedFromViewer: true }), pr())
    ).toBe(1);
  });

  it("Ready to merge counts approved, passing, clean PRs", () => {
    expect(
      count(
        "Ready to merge",
        pr({ review: "approved" }),
        pr({ review: "approved", ci: "fail" }),
        pr({ review: "approved", mergeability: "conflict" }),
        pr({ review: "comment" })
      )
    ).toBe(1);
  });
  it("leaves out views that filter on status until it loads", () => {
    const prs = [pr({ author: "me", statusPending: true })];
    expect(count("Mine", ...prs)).toBe(1);
    expect(count("Needs my review", ...prs)).toBeUndefined();
    expect(count("Ready to merge", ...prs)).toBeUndefined();
  });
});

describe("routing", () => {
  it("shows all open PRs at the owner's root", () => {
    const views = open(null);
    expect(views.active).toBeNull();
    expect(views.redirectTo).toBeNull();
    expect(views.filters).toEqual([]);
  });

  it("finds the active view by the slug of its name", () => {
    const views = open("needs-my-review");
    expect(views.active?.id).toBe("2");
    expect(views.redirectTo).toBeNull();
    expect(views.filters).toEqual([is("ci", "fail")]);
  });

  it("redirects an unknown slug to the owner's root", () => {
    const views = open("missing");
    expect(views.active).toBeNull();
    expect(views.redirectTo).toBe("/acme");
  });

  it("links each view by slug and anything else to the root", () => {
    const views = open(null, [
      view("1", "  Needs my review!! "),
      view("2", "A -- B"),
    ]);

    expect(views.hrefFor("1")).toBe("/acme/needs-my-review");
    expect(views.hrefFor("2")).toBe("/acme/a-b");
    expect(views.hrefFor(null)).toBe("/acme");
    expect(views.hrefFor("gone")).toBe("/acme");
  });

  it("falls back to a slug of view for names without letters or digits", () => {
    const views = open("view", [view("1", "!!!")]);
    expect(views.active?.id).toBe("1");
    expect(views.hrefFor("1")).toBe("/acme/view");
  });
});

describe("draft filters", () => {
  const draft = [is("repo", "web")];

  it("start as the saved filters", () => {
    expect(open("mine").filtersChanged).toBe(false);
  });

  it("change without touching the saved view", () => {
    const start = open("needs-my-review");
    const change = start.setFilters(draft);
    const views = follow(change, "needs-my-review");
    expect(change.views).toBe(STORED);
    expect(change.navigate).toBeUndefined();
    expect(views.filters).toEqual(draft);
    expect(views.filtersChanged).toBe(true);
    expect(views.active?.filters).toEqual([is("ci", "fail")]);
  });

  it("are unchanged when they match the saved filters in any order", () => {
    const saved = [is("ci", "fail", "pass"), is("repo", "web")];
    const start = open("mine", [view("1", "Mine", saved)]);
    const reordered = [is("repo", "web"), is("ci", "pass", "fail")];
    expect(follow(start.setFilters(reordered), "mine").filtersChanged).toBe(
      false
    );
  });

  it("reset to the saved filters", () => {
    const edited = follow(
      open("needs-my-review").setFilters(draft),
      "needs-my-review"
    );

    const views = follow(edited.resetFilters(), "needs-my-review");
    expect(views.filters).toEqual([is("ci", "fail")]);
    expect(views.filtersChanged).toBe(false);
  });

  it("reset when the active view changes, and stay reset on return", () => {
    const edited = follow(open("mine").setFilters(draft), "mine");
    const other = open("needs-my-review", STORED, edited.session);
    expect(other.filters).toEqual([is("ci", "fail")]);
    expect(other.filtersChanged).toBe(false);
    const back = open("mine", STORED, other.session);
    expect(back.filters).toEqual([]);
    expect(back.filtersChanged).toBe(false);
  });

  it("apply at the owner's root, where nothing is saved", () => {
    const views = follow(open(null).setFilters(draft), null);
    expect(views.filters).toEqual(draft);
    expect(views.filtersChanged).toBe(true);
    expect(open("mine", STORED, views.session).filters).toEqual([]);
  });

  it("clear and go to the owner's root on show all", () => {
    const edited = follow(open("mine").setFilters(draft), "mine");
    const change = edited.showAll();
    expect(change.navigate).toEqual({ to: "/acme" });
    expect(change.views).toBe(STORED);
    expect(follow(change, "mine").filters).toEqual([]);
  });
});

describe("save", () => {
  const draft = [is("repo", "web")];

  it("stores the draft on the active view and stays put", () => {
    const edited = follow(open("mine").setFilters(draft), "mine");
    const change = edited.save();
    expect(change.navigate).toBeUndefined();
    expect(change.views).toEqual([{ ...STORED[0], filters: draft }, STORED[1]]);
    expect(follow(change, "mine").filtersChanged).toBe(false);
  });

  it("does nothing at the owner's root", () => {
    const edited = follow(open(null).setFilters(draft), null);
    const change = edited.save();
    expect(change.views).toBe(STORED);
    expect(follow(change, null).filters).toEqual(draft);
  });
});

describe("save as new", () => {
  const draft = [is("repo", "web")];

  it("appends a view with the draft, opens it and starts renaming it", () => {
    const edited = follow(open("mine").setFilters(draft), "mine");
    const change = edited.saveAsNew();
    const { 2: created } = change.views;
    expect(change.views.slice(0, 2)).toEqual(STORED);
    expect(created).toMatchObject({ name: "New view", filters: draft });
    expect(created.isDefault).toBeUndefined();
    expect(change.navigate).toEqual({ to: "/acme/new-view" });

    const views = follow(change, "mine");
    expect(views.active).toBe(created);
    expect(views.session.renamingViewId).toBe(created.id);
    expect(views.filtersChanged).toBe(false);
    expect(views.deletableViewId).toBe(created.id);
  });

  it("leaves the view it was made from untouched", () => {
    const edited = follow(open("mine").setFilters(draft), "mine");
    const views = open("mine", edited.saveAsNew().views);
    expect(views.filters).toEqual([]);
  });

  it("picks the first free name", () => {
    const stored = [view("1", "New view"), view("2", "new VIEW 2")];
    const change = open(null, stored).saveAsNew();
    expect(change.views[2].name).toBe("New view 3");
    expect(change.navigate).toEqual({ to: "/acme/new-view-3" });
  });
});

describe("rename", () => {
  it("enters and leaves rename mode", () => {
    const renaming = follow(open("mine").setRenaming("2"), "mine");
    expect(renaming.session.renamingViewId).toBe("2");
    expect(
      follow(renaming.setRenaming(null), "mine").session.renamingViewId
    ).toBeNull();
  });

  it("renames the active view and replaces the URL", () => {
    const renaming = follow(open("mine").setRenaming("1"), "mine");
    const change = renaming.rename("1", "  Authored by me ");
    expect(names(change.views)).toEqual(["Authored by me", "Needs my review"]);
    expect(change.navigate).toEqual({
      to: "/acme/authored-by-me",
      replace: true,
    });

    const views = follow(change, "mine");
    expect(views.active?.id).toBe("1");
    expect(views.redirectTo).toBeNull();
    expect(views.session.renamingViewId).toBeNull();
  });

  it("keeps the draft when renaming the active view", () => {
    const draft = [is("repo", "web")];
    const edited = follow(open("mine").setFilters(draft), "mine");
    const views = follow(edited.rename("1", "Authored"), "mine");
    expect(views.filters).toEqual(draft);
    expect(views.filtersChanged).toBe(true);
  });

  it("renames another view without navigating", () => {
    const change = open("mine").rename("2", "Review queue");
    expect(names(change.views)).toEqual(["Mine", "Review queue"]);
    expect(change.navigate).toBeUndefined();
  });

  it("names empty input", () => {
    expect(open("mine").rename("2", "   ").views[1].name).toBe("Untitled view");
  });

  it("numbers a name whose slug is taken by another view", () => {
    const stored = [view("1", "Mine"), view("2", "Mine 2"), view("3", "Other")];
    expect(open(null, stored).rename("3", "MINE!").views[2].name).toBe(
      "MINE! 3"
    );
  });

  it("lets a view keep its own name", () => {
    const change = open("mine").rename("1", "Mine");
    expect(change.views[0].name).toBe("Mine");
    expect(change.navigate).toEqual({ to: "/acme/mine", replace: true });
  });

  it("keeps a renamed default view protected", () => {
    const seeded = seed();
    const change = open("mine", seeded).rename(seeded[0].id, "Authored");
    expect(follow(change, "mine").deletableViewId).toBeNull();
  });
});

describe("delete", () => {
  const stored = [
    { ...view("1", "Mine"), isDefault: true },
    view("2", "Custom"),
  ];

  it("offers delete only for an active view that is not a default", () => {
    expect(open("custom", stored).deletableViewId).toBe("2");
    expect(open("mine", stored).deletableViewId).toBeNull();
    expect(open(null, stored).deletableViewId).toBeNull();
  });

  it("removes the view and goes to the owner's root", () => {
    const change = open("custom", stored).remove("2");
    expect(change.views).toEqual([stored[0]]);
    expect(change.navigate).toEqual({ to: "/acme" });
    expect(follow(change, "custom").active).toBeNull();
  });

  it("refuses to remove a default view", () => {
    const change = open("mine", stored).remove("1");
    expect(change.views).toBe(stored);
    expect(change.navigate).toBeUndefined();
  });
});
