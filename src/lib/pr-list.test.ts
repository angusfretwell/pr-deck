import { describe, expect, it } from "vite-plus/test";
import type { PullRequest } from "../types";
import {
  applySelectionAction,
  derivePrList,
  NO_SELECTION,
  toggleGroup,
  type PrListInput,
  type Selection,
  type SelectionAction,
} from "./pr-list";

const pr = (id: string, repo: string, author: string): PullRequest => ({
  id,
  owner: "acme",
  repo,
  number: Number(id),
  title: `Title ${id}`,
  url: `https://github.com/acme/${repo}/pull/${id}`,
  author,
  authorAvatarUrl: "",
  isDraft: false,
  branch: "feature",
  updatedAt: "2026-01-01T00:00:00Z",
  ci: "pass",
  mergeability: "clean",
  review: "none",
  reviewers: [],
  reviewRequestedFromViewer: false,
});

const PRS = [
  pr("1", "web", "bob"),
  pr("2", "api", "alice"),
  pr("3", "web", "alice"),
  pr("4", "docs", "bob"),
];

const list = (overrides: Partial<PrListInput> = {}) =>
  derivePrList({
    pullRequests: PRS,
    query: "",
    filters: [],
    viewer: "me",
    group: "repo",
    collapsed: [],
    selection: NO_SELECTION,
    desktop: true,
    ...overrides,
  });

const selecting = (selectedId: string | null, previewOpen = false): Selection => ({
  selectedId,
  previewOpen,
});

const rowIds = (groups: { key: string; rows: PullRequest[] }[]) =>
  groups.map((group) => [group.key, group.rows.map((row) => row.id)]);

describe("pipeline", () => {
  it("groups by repo with sorted keys, keeping input order within a group", () => {
    const { groups, order } = list();
    expect(rowIds(groups)).toEqual([
      ["api", ["2"]],
      ["docs", ["4"]],
      ["web", ["1", "3"]],
    ]);
    expect(order).toEqual(["2", "4", "1", "3"]);
  });

  it("groups by author", () => {
    expect(rowIds(list({ group: "author" }).groups)).toEqual([
      ["alice", ["2", "3"]],
      ["bob", ["1", "4"]],
    ]);
  });

  it("keeps one unnamed group in input order when ungrouped", () => {
    const { groups, order } = list({ group: "none" });
    expect(rowIds(groups)).toEqual([["", ["1", "2", "3", "4"]]]);
    expect(order).toEqual(["1", "2", "3", "4"]);
  });

  it("applies the search before the filters and reports the searched set", () => {
    const { scoped, order } = list({
      query: "web",
      filters: [{ key: "author", values: ["alice"], negated: false }],
    });
    expect(scoped.map((row) => row.id)).toEqual(["1", "3"]);
    expect(order).toEqual(["3"]);
  });

  it("keeps a collapsed group in the groups but out of the navigable order", () => {
    const { groups, order } = list({ collapsed: ["repo:web"] });
    expect(groups.map((group) => [group.key, group.collapsed])).toEqual([
      ["api", false],
      ["docs", false],
      ["web", true],
    ]);
    expect(order).toEqual(["2", "4"]);
  });

  it("ignores groups collapsed under another grouping", () => {
    expect(list({ collapsed: ["author:web"] }).groups.every((group) => !group.collapsed)).toBe(
      true,
    );
  });
});

describe("toggleGroup", () => {
  it("collapses and expands one group, leaving other entries alone", () => {
    const collapsed = toggleGroup(list({ collapsed: ["author:bob"] }), "web", false);
    expect(collapsed).toEqual(["author:bob", "repo:web"]);
    expect(toggleGroup(list({ collapsed }), "web", false)).toEqual(["author:bob"]);
  });

  it("collapses every group of the current grouping at once", () => {
    expect(toggleGroup(list({ collapsed: ["repo:api"] }), "web", true)).toEqual([
      "repo:api",
      "repo:docs",
      "repo:web",
    ]);
  });

  it("expands every group at once when the toggled group is collapsed", () => {
    const collapsed = ["repo:api", "author:bob", "repo:web"];
    expect(toggleGroup(list({ collapsed }), "web", true)).toEqual(["author:bob"]);
  });
});

describe("selection actions", () => {
  const act = (selection: Selection, action: SelectionAction, overrides?: Partial<PrListInput>) =>
    applySelectionAction(list({ selection, ...overrides }), action);

  it("starts at the first row when nothing is selected, whichever way it moves", () => {
    expect(act(NO_SELECTION, { type: "move", delta: 1 })).toEqual(selecting("2"));
    expect(act(NO_SELECTION, { type: "move", delta: -1 })).toEqual(selecting("2"));
  });

  it("moves through the order across groups", () => {
    expect(act(selecting("2"), { type: "move", delta: 1 })).toEqual(selecting("4"));
    expect(act(selecting("1"), { type: "move", delta: -1 })).toEqual(selecting("4"));
  });

  it("clamps at both ends", () => {
    expect(act(selecting("2"), { type: "move", delta: -1 })).toEqual(selecting("2"));
    expect(act(selecting("3"), { type: "move", delta: 1 })).toEqual(selecting("3"));
  });

  it("skips collapsed groups", () => {
    expect(act(selecting("2"), { type: "move", delta: 1 }, { collapsed: ["repo:docs"] })).toEqual(
      selecting("1"),
    );
  });

  it("keeps the preview open while moving", () => {
    expect(act(selecting("2", true), { type: "move", delta: 1 })).toEqual(selecting("4", true));
  });

  it("does nothing when there are no rows to move through", () => {
    expect(act(selecting("2"), { type: "move", delta: 1 }, { query: "nope" })).toEqual(
      selecting("2"),
    );
  });

  it("opens the preview when a row is selected by pointer", () => {
    expect(act(NO_SELECTION, { type: "select", id: "3" })).toEqual(selecting("3", true));
  });

  it("toggles the preview for the selected row", () => {
    expect(act(selecting("3"), { type: "togglePreview" })).toEqual(selecting("3", true));
    expect(act(selecting("3", true), { type: "togglePreview" })).toEqual(selecting("3"));
  });

  it("does not toggle the preview with nothing selected", () => {
    expect(act(NO_SELECTION, { type: "togglePreview" })).toEqual(NO_SELECTION);
  });

  it("closes the preview on escape, then clears the selection", () => {
    const closed = act(selecting("3", true), { type: "escape" });
    expect(closed).toEqual(selecting("3"));
    expect(act(closed, { type: "escape" })).toEqual(NO_SELECTION);
  });

  it("keeps the selection when the preview is closed", () => {
    expect(act(selecting("3", true), { type: "closePreview" })).toEqual(selecting("3"));
  });
});

describe("highlight and preview by screen size", () => {
  it("highlights and previews the selected row on desktop", () => {
    const { highlightedId, selected, previewed } = list({ selection: selecting("3", true) });
    expect(highlightedId).toBe("3");
    expect(selected?.id).toBe("3");
    expect(previewed?.id).toBe("3");
  });

  it("keeps the highlight on desktop once the preview closes", () => {
    const { highlightedId, previewed } = list({ selection: selecting("3") });
    expect(highlightedId).toBe("3");
    expect(previewed).toBeUndefined();
  });

  it("highlights the row on a phone while its drawer is open, without a side preview", () => {
    const { highlightedId, selected, previewed } = list({
      selection: selecting("3", true),
      desktop: false,
    });
    expect(highlightedId).toBe("3");
    expect(selected?.id).toBe("3");
    expect(previewed).toBeUndefined();
  });

  it("drops the highlight on a phone once the drawer closes", () => {
    const open = list({ selection: selecting("3", true), desktop: false });
    const closed = list({
      selection: applySelectionAction(open, { type: "closePreview" }),
      desktop: false,
    });
    expect(closed.selection).toEqual(selecting("3"));
    expect(closed.highlightedId).toBeNull();
  });
});

describe("a selection that leaves the visible set", () => {
  const hidden = { query: "docs", selection: selecting("3", true) };

  it("hides the preview but remembers the selection", () => {
    const { selected, previewed, selection } = list(hidden);
    expect(selected).toBeUndefined();
    expect(previewed).toBeUndefined();
    expect(selection).toEqual(selecting("3", true));
  });

  it("restores the preview when the row comes back", () => {
    expect(list({ ...hidden, query: "" }).previewed?.id).toBe("3");
  });

  it("restarts movement from the first visible row", () => {
    expect(applySelectionAction(list(hidden), { type: "move", delta: 1 })).toEqual(
      selecting("4", true),
    );
  });

  it("ignores preview toggles", () => {
    expect(applySelectionAction(list(hidden), { type: "togglePreview" })).toEqual(
      selecting("3", true),
    );
  });

  it("still takes two escapes to clear", () => {
    const closed = applySelectionAction(list(hidden), { type: "escape" });
    expect(closed).toEqual(selecting("3"));
    expect(
      applySelectionAction(list({ ...hidden, selection: closed }), { type: "escape" }),
    ).toEqual(NO_SELECTION);
  });

  it("keeps previewing a row in a collapsed group but treats it as unnavigable", () => {
    const collapsed = list({ collapsed: ["repo:web"], selection: selecting("3", true) });
    expect(collapsed.previewed?.id).toBe("3");
    expect(applySelectionAction(collapsed, { type: "togglePreview" })).toEqual(
      selecting("3", true),
    );
    expect(applySelectionAction(collapsed, { type: "move", delta: 1 })).toEqual(
      selecting("2", true),
    );
  });
});
