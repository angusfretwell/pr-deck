import type { Filter, Group, PullRequest } from "../types";
import { awaitsStatus, matchesText, passes } from "./filters";
import { clusterByStack } from "./stacks";
import type { Cluster, StackIndex } from "./stacks";

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
  starred: string[];
  selection: Selection;
  desktop: boolean;
}

export interface PrListGroup {
  key: string;
  rows: PullRequest[];
  clusters: Cluster[];
  collapsed: boolean;
  starred: boolean;
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
  starred: string[];
}

export type ToggleScope = "group" | "all" | "others";

export type SelectionAction =
  | { type: "move"; delta: 1 | -1 }
  | { type: "select"; id: string }
  | { type: "togglePreview" }
  | { type: "closePreview" }
  | { type: "escape" };

const groupId = (group: Group, key: string) => `${group}:${key}`;

const groupRows = (prs: PullRequest[], group: Group) => {
  if (group === "none") {
    return [{ key: "", rows: prs }];
  }

  const keys = [...new Set(prs.map((pr) => pr[group]))].toSorted();

  return keys.map((key) => ({
    key,
    rows: prs.filter((pr) => pr[group] === key),
  }));
};

export const derivePrList = ({
  pullRequests,
  stacks,
  query,
  filters,
  viewer,
  group,
  collapsed,
  starred,
  selection,
  desktop,
}: PrListInput) => {
  const scoped = pullRequests.filter((pr) => matchesText(pr, query));
  const visible = scoped.filter((pr) => passes(pr, filters, viewer));

  const groups = groupRows(visible, group)
    .map(({ key, rows }) => {
      const clusters = clusterByStack(rows, stacks);

      return {
        key,
        rows: clusters.flatMap((cluster) => cluster.rows),
        clusters,
        collapsed: collapsed.includes(groupId(group, key)),
        starred: starred.includes(groupId(group, key)),
      };
    })
    .toSorted((a, b) => Number(b.starred) - Number(a.starred));

  const selected = visible.find((pr) => pr.id === selection.selectedId);

  return {
    scoped,
    statusPending: awaitsStatus(filters, scoped),
    groups,
    order: groups.flatMap((entry) =>
      entry.collapsed ? [] : entry.rows.map((pr) => pr.id)
    ),
    selected,
    previewed: desktop && selection.previewOpen ? selected : undefined,
    highlightedId:
      desktop || selection.previewOpen ? selection.selectedId : null,
    selection,
    group,
    collapsed,
    starred,
  } satisfies PrList;
};

const navigableIndex = ({ order, selection }: PrList) =>
  selection.selectedId !== null && selection.selectedId !== ""
    ? order.indexOf(selection.selectedId)
    : -1;

export const applySelectionAction = (list: PrList, action: SelectionAction) => {
  const { order, selection } = list;

  switch (action.type) {
    case "move": {
      if (!order.length) {
        return selection;
      }

      const index = navigableIndex(list);

      const next = Math.max(
        0,
        Math.min(order.length - 1, index < 0 ? 0 : index + action.delta)
      );

      return { ...selection, selectedId: order[next] ?? null };
    }

    case "select": {
      return { selectedId: action.id, previewOpen: true };
    }

    case "togglePreview": {
      return navigableIndex(list) < 0
        ? selection
        : { ...selection, previewOpen: !selection.previewOpen };
    }

    case "closePreview": {
      return { ...selection, previewOpen: false };
    }

    case "escape": {
      return selection.previewOpen
        ? { ...selection, previewOpen: false }
        : NO_SELECTION;
    }

    default: {
      return selection;
    }
  }
};

const setGroupsCollapsed = (
  list: PrList,
  keys: string[],
  collapse: boolean
) => {
  const { collapsed, group } = list;
  const ids = keys.map((key) => groupId(group, key));

  return collapse
    ? [...collapsed, ...ids.filter((added) => !collapsed.includes(added))]
    : collapsed.filter((existing) => !ids.includes(existing));
};

const groupKeys = ({ groups }: PrList) => groups.map((entry) => entry.key);

export const toggleGroup = (list: PrList, key: string, scope: ToggleScope) => {
  if (scope === "others") {
    const others = groupKeys(list).filter((other) => other !== key);

    const focused = list.groups.every(
      (entry) => entry.collapsed === (entry.key !== key)
    );

    if (focused) {
      return setGroupsCollapsed(list, others, false);
    }

    const collapsed = setGroupsCollapsed(list, others, true);

    return setGroupsCollapsed({ ...list, collapsed }, [key], false);
  }

  const collapse = !list.collapsed.includes(groupId(list.group, key));

  return setGroupsCollapsed(
    list,
    scope === "all" ? groupKeys(list) : [key],
    collapse
  );
};

export const allGroupsCollapsed = ({ groups }: PrList) =>
  groups.every((entry) => entry.collapsed);

export const toggleAllGroups = (list: PrList) =>
  setGroupsCollapsed(list, groupKeys(list), !allGroupsCollapsed(list));

export const toggleStar = ({ starred, group }: PrList, key: string) => {
  const id = groupId(group, key);

  return starred.includes(id)
    ? starred.filter((existing) => existing !== id)
    : [...starred, id];
};
