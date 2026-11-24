import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { createContext, use, useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useEventCallback, useInterval } from "usehooks-ts";

import {
  allGroupsCollapsed,
  applySelectionAction,
  derivePrList,
  toggleAllGroups,
  toggleGroup,
  toggleStar,
} from "@/features/pr-table/lib/pr-list";
import type {
  PrList,
  PrListInput,
  Selection,
  SelectionAction,
  ToggleScope,
} from "@/features/pr-table/lib/pr-list";
import { deriveStacks } from "@/features/pr-table/lib/stacks";
import { setSearchQuery, useSearch } from "@/features/search/lib/search-store";
import { countByView } from "@/features/views/lib/views";
import type { Views, ViewsChange } from "@/features/views/lib/views";
import { usePullRequests } from "@/github/hooks";
import { useDesktop } from "@/hooks/use-desktop";
import {
  setOwnerGroups,
  useOwnerGroups,
  usePreferences,
} from "@/lib/preferences";
import {
  selectionParams,
  selectionUrlKeys,
} from "@/pages/org/lib/selection-param";
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
  const query = useSearch((state) => state.query);
  const group = usePreferences((state) => state.group);
  const hideDraftsPreference = usePreferences((state) => state.hideDrafts);
  const collapsedGroups = useOwnerGroups("collapsedGroups", owner);
  const starredGroups = useOwnerGroups("starredGroups", owner);

  const [selection, setSelection] = useQueryStates(selectionParams, {
    urlKeys: selectionUrlKeys,
  });

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
    void setSelection(applySelectionAction(list, { type: "select", id }));
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
            void setSelection(applySelectionAction(list, action));
          },
          select,
          toggleAllGroups:
            group !== "none" && list.groups.length > 0
              ? () => {
                  setOwnerGroups(
                    "collapsedGroups",
                    owner,
                    toggleAllGroups(list)
                  );
                }
              : undefined,
          toggleGroup(key, scope) {
            setOwnerGroups(
              "collapsedGroups",
              owner,
              toggleGroup(list, key, scope)
            );
          },
          toggleStar(key) {
            setOwnerGroups("starredGroups", owner, toggleStar(list, key));
          },
          commit,
          showAll() {
            commit(views.showAll());
            setSearchQuery("");
          },
          clearSearch() {
            setSearchQuery("");
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
      setSelection,
      commit,
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
