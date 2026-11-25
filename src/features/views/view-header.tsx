import { FilterIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel } from "@/components/ui/collapsible";
import { HOTKEYS } from "@/features/shortcuts/lib/hotkeys";
import { useFilterContextValue } from "@/features/views/hooks/use-filter-context-value";
import type { Filter, PullRequest } from "@/types";

import { FilterBar } from "./filter-bar";
import { FilterContext } from "./filter-context";
import type { MenuAnchor } from "./filter-context";
import { FilterDrawer } from "./filter-drawer";
import { FilterMenu } from "./filter-menu";
import { FilterTrigger } from "./filter-trigger";
import { Hint } from "./hint";
import { NewViewActions, SavedViewActions } from "./view-actions";

export interface FilterMenuState {
  anchor: MenuAnchor;
  deferBar?: boolean;
}

export interface ViewHeaderProps {
  children: ReactNode;

  filters: Filter[];
  filtersChanged: boolean;
  onFiltersChange: (filters: Filter[]) => void;
  onResetFilters: () => void;
  onSaveView?: () => void;
  onSaveAsNewView: () => void;

  filterMenu: FilterMenuState | null;
  onFilterMenuChange: (anchor: MenuAnchor | null) => void;

  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  viewer: string;
}

export function ViewHeader({
  children,
  filters,
  filtersChanged,
  onFiltersChange,
  onResetFilters,
  onSaveView,
  onSaveAsNewView,
  filterMenu,
  onFilterMenuChange,
  orgPrs,
  scopedPrs,
  viewer,
}: ViewHeaderProps) {
  const value = useFilterContextValue({
    filters,
    onFiltersChange,
    openAnchor: filterMenu?.anchor ?? null,
    onFilterMenuChange,
    orgPrs,
    scopedPrs,
    viewer,
  });

  const barVisible = filtersChanged
    ? filterMenu?.deferBar !== true
    : filterMenu !== null && filterMenu.anchor !== "header";

  const actions = onSaveView ? (
    <SavedViewActions
      onReset={onResetFilters}
      onSaveAsNew={onSaveAsNewView}
      onSave={onSaveView}
    />
  ) : (
    <NewViewActions onClear={onResetFilters} onSaveAsNew={onSaveAsNewView} />
  );

  return (
    <div className="border-b">
      <FilterContext value={value}>
        <div className="flex items-center gap-1.5 px-2 py-2.5 md:px-4">
          {children}
        </div>
        <Collapsible open={barVisible}>
          <CollapsiblePanel className="ease-snappy transition-[height,opacity] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-opacity">
            <FilterBar actions={filtersChanged && actions} />
          </CollapsiblePanel>
        </Collapsible>
        {value.meta.drawer ? <FilterDrawer /> : <FilterMenu />}
      </FilterContext>
    </div>
  );
}

export function FilterButton() {
  return (
    <Hint label="Filter" hotkey={HOTKEYS.filter}>
      <FilterTrigger
        anchor="header"
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full before:rounded-full max-md:ms-auto"
            aria-label="Filter"
          />
        }
      >
        <FilterIcon />
      </FilterTrigger>
    </Hint>
  );
}
