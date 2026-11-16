import { FilterIcon } from "@primer/octicons-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel } from "@/components/ui/collapsible";
import {
  PopoverCreateHandle,
  type PopoverPrimitive,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toggleValue } from "@/lib/filters";
import type { Filter, Group, PropertyKey, PullRequest, View } from "@/types";
import { DisplayMenu } from "./view-header/display-menu";
import { DraftsToggle } from "./view-header/drafts-toggle";
import { FilterBar } from "./view-header/filter-bar";
import { FilterMenu } from "./view-header/filter-menu";
import { Hint } from "./view-header/hint";
import { ViewTabs } from "./view-header/view-tabs";

export type MenuAnchor = "header" | "add" | PropertyKey;

export interface FilterMenuState {
  anchor: MenuAnchor;
  deferBar?: boolean;
}

export interface FilterTriggerProps {
  handle: PopoverPrimitive.Handle<MenuAnchor>;
  payload: MenuAnchor;
  id: string;
}

export interface ViewHeaderProps {
  views: View[];
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  activeViewId: string | null;
  deletableViewId: string | null;
  renamingViewId: string | null;
  viewHref: (id: string | null) => string;
  onRenamingViewChange: (id: string | null) => void;
  onRenameView: (id: string, name: string) => void;
  onDeleteView: (id: string) => void;

  filters: Filter[];
  filtersChanged: boolean;
  onFiltersChange: (filters: Filter[]) => void;
  onResetFilters: () => void;
  onSaveView: () => void;
  onSaveAsNewView: () => void;

  filterMenu: FilterMenuState | null;
  onFilterMenuChange: (anchor: MenuAnchor | null) => void;
  displayMenuOpen: boolean;
  onDisplayMenuOpenChange: (open: boolean) => void;
  group: Group;
  onGroupChange: (group: Group) => void;
  hideDrafts: boolean;
  onHideDraftsChange: (hideDrafts: boolean) => void;

  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  viewer: string;
}

export function ViewHeader({
  filters,
  filtersChanged,
  onFiltersChange,
  onResetFilters,
  onSaveView,
  onSaveAsNewView,
  filterMenu,
  onFilterMenuChange,
  displayMenuOpen,
  onDisplayMenuOpenChange,
  group,
  onGroupChange,
  hideDrafts,
  onHideDraftsChange,
  orgPrs,
  scopedPrs,
  viewer,
  ...tabs
}: ViewHeaderProps) {
  const [filterMenuHandle] = useState(() => PopoverCreateHandle<MenuAnchor>());
  const triggerIdPrefix = useId();
  const filterTrigger = (anchor: MenuAnchor): FilterTriggerProps => ({
    handle: filterMenuHandle,
    payload: anchor,
    id: `${triggerIdPrefix}${anchor}`,
  });

  const changeFilterMenu = (open: boolean, trigger: Element | undefined) => {
    if (!open) return onFilterMenuChange(null);
    const anchors: MenuAnchor[] = ["header", "add", ...filters.map((filter) => filter.key)];
    const anchor = anchors.find((candidate) => filterTrigger(candidate).id === trigger?.id);
    if (anchor) onFilterMenuChange(anchor);
  };

  const barVisible = filtersChanged
    ? !filterMenu?.deferBar
    : filterMenu !== null && filterMenu.anchor !== "header";

  const toggleFilterValue = (key: PropertyKey, value: string) => {
    const next = toggleValue(filters, key, value);
    onFiltersChange(next);
    if (filterMenu?.anchor === key && !next.some((filter) => filter.key === key))
      onFilterMenuChange(null);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
    onFilterMenuChange(null);
  };

  const negateFilter = (index: number) =>
    onFiltersChange(
      filters.map((filter, i) => (i === index ? { ...filter, negated: !filter.negated } : filter)),
    );

  const actions =
    filtersChanged &&
    (tabs.activeViewId === null ? (
      <>
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          Clear
        </Button>
        <Button size="sm" onClick={onSaveAsNewView}>
          Save as view
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={onSaveAsNewView}>
          Save as new view
        </Button>
        <Button size="sm" onClick={onSaveView}>
          Save
        </Button>
      </>
    ));

  return (
    <div className="border-b">
      <div className="flex items-center gap-1.5 px-2 py-2.5 md:px-4">
        <ViewTabs {...tabs} />
        <DraftsToggle hideDrafts={hideDrafts} onHideDraftsChange={onHideDraftsChange} />
        <Hint label="Filter">
          <PopoverTrigger
            {...filterTrigger("header")}
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
          </PopoverTrigger>
        </Hint>
        <DisplayMenu
          open={displayMenuOpen}
          onOpenChange={onDisplayMenuOpenChange}
          group={group}
          onGroupChange={onGroupChange}
        />
      </div>
      <Collapsible open={barVisible}>
        <CollapsiblePanel className="transition-[height,opacity] ease-snappy data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-opacity">
          <FilterBar
            filters={filters}
            orgPrs={orgPrs}
            viewer={viewer}
            actions={actions}
            filterTrigger={filterTrigger}
            onNegate={negateFilter}
            onRemove={removeFilter}
          />
        </CollapsiblePanel>
      </Collapsible>
      <FilterMenu
        handle={filterMenuHandle}
        triggerId={filterMenu && filterTrigger(filterMenu.anchor).id}
        onOpenChange={changeFilterMenu}
        orgPrs={orgPrs}
        scopedPrs={scopedPrs}
        filters={filters}
        viewer={viewer}
        onToggle={toggleFilterValue}
      />
    </div>
  );
}
