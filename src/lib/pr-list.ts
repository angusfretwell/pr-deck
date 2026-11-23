import type { Filter, Group, PullRequest } from "../types";
import { awaitsStatus, matchesText, passes } from "./filters";
import { clusterByStack, type Cluster, type StackIndex } from "./stacks";

export interface Selection {
  selectedId: string | null;
  previewOpen: boolean;
}

export const GROUPS: { value: Group; label: string }[] = [
  { value: "repo", label: "Repository" },
  { value: "author", label: "Author" },
  { value: "none", label: "No grouping" },
];

export const NO_SELECTION: Selection = { selectedId: null, previewOpen: false };

export interface PrListInput {
  pullRequests: PullRequest[];
  stacks: StackIndex;
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
  clusters: Cluster[];
  collapsed: boolean;
}

export interface PrList {
  scoped: PullRequest[];
  statusPending: boolean;
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
  stacks,
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
  const groups = groupRows(visible, group).map(({ key, rows }) => {
    const clusters = clusterByStack(rows, stacks);
    return {
      key,
      rows: clusters.flatMap((cluster) => cluster.rows),
      clusters,
      collapsed: collapsed.includes(collapsedId(group, key)),
    };
  });
  const selected = visible.find((pr) => pr.id === selection.selectedId);
  return {
    scoped,
    statusPending: awaitsStatus(filters, scoped),
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

function setGroupsCollapsed(list: PrList, keys: string[], collapse: boolean): string[] {
  const { collapsed, group } = list;
  const ids = keys.map((key) => collapsedId(group, key));
  return collapse
    ? [...collapsed, ...ids.filter((added) => !collapsed.includes(added))]
    : collapsed.filter((existing) => !ids.includes(existing));
}

const groupKeys = ({ groups }: PrList) => groups.map((entry) => entry.key);

export function toggleGroup(list: PrList, key: string, all: boolean): string[] {
  const collapse = !list.collapsed.includes(collapsedId(list.group, key));
  return setGroupsCollapsed(list, all ? groupKeys(list) : [key], collapse);
}

export const allGroupsCollapsed = ({ groups }: PrList) => groups.every((entry) => entry.collapsed);

export const toggleAllGroups = (list: PrList) =>
  setGroupsCollapsed(list, groupKeys(list), !allGroupsCollapsed(list));
