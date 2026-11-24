import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, use, useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useEventCallback, useInterval } from "usehooks-ts";

import { useSearch } from "@/components/search-context";
import { usePullRequests } from "@/github/hooks";
import {
  allGroupsCollapsed,
  applySelectionAction,
  derivePrList,
  NO_SELECTION,
  toggleAllGroups,
  toggleGroup,
  toggleStar,
} from "@/lib/pr-list";
import type {
  PrList,
  PrListInput,
  Selection,
  SelectionAction,
  ToggleScope,
} from "@/lib/pr-list";
import { deriveStacks } from "@/lib/stacks";
import {
  useCollapsedGroups,
  useGroup,
  useHideDrafts,
  useStarredGroups,
} from "@/lib/storage";
import { useDesktop } from "@/lib/use-desktop";
import { countByView } from "@/lib/views";
import type { Views, ViewsChange } from "@/lib/views";
import type { Account, Group, PullRequest, PullRequestList } from "@/types";

export type ListBase = Omit<PrListInput, "filters" | "selection">;

export interface OrgListState {
  views: Views;
  list: PrList;
  listInput: ListBase;
  selection: Selection;
  group: Group;
  hideDrafts: boolean;
  pullRequests: UseQueryResult<PullRequestList>;
  allPrs: PullRequest[];
  orgPrs: PullRequest[];
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  groupsCollapsed: boolean;
  now: number;
  deferredQuery: string;
}

export interface OrgListActions {
  act: (action: SelectionAction) => void;
  select: (id: string) => void;
  setGroup: (group: Group) => void;
  setHideDrafts: (hideDrafts: boolean) => void;
  toggleAllGroups: (() => void) | undefined;
  toggleGroup: (key: string, scope: ToggleScope) => void;
  toggleStar: (key: string) => void;
  commit: (change: ViewsChange) => void;
  showAll: () => void;
  clearSearch: () => void;
}

export interface OrgListMeta {
  owner: string;
  owners: Account[];
  viewer: string;
  desktop: boolean;
}

export interface OrgListContextValue {
  state: OrgListState;
  actions: OrgListActions;
  meta: OrgListMeta;
}

const NO_PULL_REQUESTS: PullRequest[] = [];

const OrgListContext = createContext<OrgListContextValue | null>(null);

interface OrgListProviderProps {
  owner: string;
  owners: Account[];
  viewer: string;
  views: Views;
  commit: (change: ViewsChange) => void;
  children: ReactNode;
}

export function OrgListProvider({
  owner,
  owners,
  viewer,
  views,
  commit,
  children,
}: OrgListProviderProps) {
  const {
    state: { query },
    actions: { setQuery },
  } = useSearch();

  const [group, setGroup] = useGroup();
  const [hideDraftsPreference, setHideDrafts] = useHideDrafts();
  const [collapsedGroups, setCollapsedGroups] = useCollapsedGroups(owner);
  const [starredGroups, setStarredGroups] = useStarredGroups(owner);
  const [selection, setSelection] = useState(NO_SELECTION);
  const viewId = views.active?.id ?? null;
  const [shownViewId, setShownViewId] = useState(viewId);

  if (shownViewId !== viewId) {
    setShownViewId(viewId);
    setSelection(NO_SELECTION);
  }

  const desktop = useDesktop();
  const pullRequests = usePullRequests(owner);
  const deferredQuery = useDeferredValue(query);
  const [now, setNow] = useState(Date.now);
  useInterval(() => {
    setNow(Date.now());
  }, 60_000);

  const hideDrafts = desktop && hideDraftsPreference;
  const allPrs = pullRequests.data?.pullRequests ?? NO_PULL_REQUESTS;
  const stacks = useMemo(() => deriveStacks(allPrs), [allPrs]);

  const orgPrs = useMemo(
    () => (hideDrafts ? allPrs.filter((pr) => !pr.isDraft) : allPrs),
    [allPrs, hideDrafts]
  );

  const listInput = useMemo(
    () => ({
      pullRequests: orgPrs,
      stacks,
      query: deferredQuery,
      viewer,
      group,
      collapsed: collapsedGroups,
      starred: starredGroups,
      desktop,
    }),
    [
      orgPrs,
      stacks,
      deferredQuery,
      viewer,
      group,
      collapsedGroups,
      starredGroups,
      desktop,
    ]
  );

  const list = derivePrList({
    ...listInput,
    filters: views.filters,
    selection,
  });

  const select = useEventCallback((id: string) => {
    setSelection(applySelectionAction(list, { type: "select", id }));
  });

  const value = useMemo(
    () =>
      ({
        state: {
          views,
          list,
          listInput,
          selection,
          group,
          hideDrafts,
          pullRequests,
          allPrs,
          orgPrs,
          viewCounts: pullRequests.data
            ? countByView(views.list, orgPrs, viewer)
            : {},
          allOpenCount: pullRequests.data && orgPrs.length,
          groupsCollapsed: allGroupsCollapsed(list),
          now,
          deferredQuery,
        },
        actions: {
          act(action) {
            setSelection(applySelectionAction(list, action));
          },
          select,
          setGroup,
          setHideDrafts,
          toggleAllGroups:
            group !== "none" && list.groups.length > 0
              ? () => {
                  setCollapsedGroups(toggleAllGroups(list));
                }
              : undefined,
          toggleGroup(key, scope) {
            setCollapsedGroups(toggleGroup(list, key, scope));
          },
          toggleStar(key) {
            setStarredGroups(toggleStar(list, key));
          },
          commit,
          showAll() {
            commit(views.showAll());
            setQuery("");
          },
          clearSearch() {
            setQuery("");
          },
        },
        meta: { owner, owners, viewer, desktop },
      }) satisfies OrgListContextValue,
    [
      views,
      list,
      listInput,
      selection,
      group,
      hideDrafts,
      pullRequests,
      allPrs,
      orgPrs,
      viewer,
      now,
      deferredQuery,
      select,
      setGroup,
      setHideDrafts,
      setCollapsedGroups,
      setStarredGroups,
      commit,
      setQuery,
      owner,
      owners,
      desktop,
    ]
  );

  return <OrgListContext value={value}>{children}</OrgListContext>;
}

export function useOrgList() {
  const context = use(OrgListContext);

  if (!context) {
    throw new Error("useOrgList must be used within an OrgListProvider");
  }

  return context;
}
