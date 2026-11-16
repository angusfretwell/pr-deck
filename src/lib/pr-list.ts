import type { Filter, Group, PullRequest } from "../types";
import { matchesText, passes } from "./filters";

export interface Selection {
  selectedId: string | null;
  previewOpen: boolean;
}

export const NO_SELECTION: Selection = { selectedId: null, previewOpen: false };

export interface PrListInput {
  pullRequests: PullRequest[];
  query: string;
  filters: Filter[];
  viewer: string;
  group: Group;
  collapsed: string[];
  selection: Selection;
  desktop: boolean;
}

export interface PrListGroup {
  key: string;
  rows: PullRequest[];
  collapsed: boolean;
}

export interface PrList {
  scoped: PullRequest[];
  groups: PrListGroup[];
  order: string[];
  selected: PullRequest | undefined;
  previewed: PullRequest | undefined;
  highlightedId: string | null;
  selection: Selection;
  group: Group;
  collapsed: string[];
}

export type SelectionAction =
  | { type: "move"; delta: 1 | -1 }
  | { type: "select"; id: string }
  | { type: "togglePreview" }
  | { type: "closePreview" }
  | { type: "escape" };

const collapsedId = (group: Group, key: string) => `${group}:${key}`;

function groupRows(prs: PullRequest[], group: Group) {
  if (group === "none") return [{ key: "", rows: prs }];
  const keys = [...new Set(prs.map((pr) => pr[group]))].sort();
  return keys.map((key) => ({ key, rows: prs.filter((pr) => pr[group] === key) }));
}

export function derivePrList({
  pullRequests,
  query,
  filters,
  viewer,
  group,
  collapsed,
  selection,
  desktop,
}: PrListInput): PrList {
  const scoped = pullRequests.filter((pr) => matchesText(pr, query));
  const visible = scoped.filter((pr) => passes(pr, filters, viewer));
  const groups = groupRows(visible, group).map((entry) => ({
    ...entry,
    collapsed: collapsed.includes(collapsedId(group, entry.key)),
  }));
  const selected = visible.find((pr) => pr.id === selection.selectedId);
  return {
    scoped,
    groups,
    order: groups.flatMap((entry) => (entry.collapsed ? [] : entry.rows.map((pr) => pr.id))),
    selected,
    previewed: desktop && selection.previewOpen ? selected : undefined,
    highlightedId: desktop || selection.previewOpen ? selection.selectedId : null,
    selection,
    group,
    collapsed,
  };
}

const navigableIndex = ({ order, selection }: PrList) =>
  selection.selectedId ? order.indexOf(selection.selectedId) : -1;

export function applySelectionAction(list: PrList, action: SelectionAction): Selection {
  const { order, selection } = list;
  switch (action.type) {
    case "move": {
      if (!order.length) return selection;
      const index = navigableIndex(list);
      const next = Math.max(0, Math.min(order.length - 1, index < 0 ? 0 : index + action.delta));
      return { ...selection, selectedId: order[next] ?? null };
    }
    case "select":
      return { selectedId: action.id, previewOpen: true };
    case "togglePreview":
      return navigableIndex(list) < 0
        ? selection
        : { ...selection, previewOpen: !selection.previewOpen };
    case "closePreview":
      return { ...selection, previewOpen: false };
    case "escape":
      return selection.previewOpen ? { ...selection, previewOpen: false } : NO_SELECTION;
  }
}

export function toggleGroup(list: PrList, key: string, all: boolean): string[] {
  const { collapsed, group, groups } = list;
  const id = collapsedId(group, key);
  const ids = all ? groups.map((entry) => collapsedId(group, entry.key)) : [id];
  return collapsed.includes(id)
    ? collapsed.filter((existing) => !ids.includes(existing))
    : [...collapsed, ...ids.filter((added) => !collapsed.includes(added))];
}
