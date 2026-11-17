import { FilterIcon } from "@primer/octicons-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel } from "@/components/ui/collapsible";
import { DrawerCreateHandle } from "@/components/ui/drawer";
import { PopoverCreateHandle } from "@/components/ui/popover";
import { toggleValue } from "@/lib/filters";
import { useDesktop } from "@/lib/use-desktop";
import type { Filter, PropertyKey, PullRequest } from "@/types";
import { FilterBar } from "./view-header/filter-bar";
import { FilterDrawer } from "./view-header/filter-drawer";
import { FilterMenu } from "./view-header/filter-menu";
import { FilterTrigger } from "./view-header/filter-trigger";
import { FilterTriggerContext, type MenuAnchor } from "./view-header/filter-trigger-context";
import { Hint } from "./view-header/hint";

export type { MenuAnchor };

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
  const desktop = useDesktop();
  const [popoverHandle] = useState(() => PopoverCreateHandle<MenuAnchor>());
  const [drawerHandle] = useState(() => DrawerCreateHandle<MenuAnchor>());
  const triggerIdPrefix = useId();
  const triggerId = (anchor: MenuAnchor) => `${triggerIdPrefix}${anchor}`;

  const changeFilterMenu = (open: boolean, trigger: Element | undefined) => {
    if (!open) return onFilterMenuChange(null);
    const anchors: MenuAnchor[] = ["header", "add", ...filters.map((filter) => filter.key)];
    const anchor = anchors.find((candidate) => triggerId(candidate) === trigger?.id);
    if (anchor) onFilterMenuChange(anchor);
  };

  const barVisible = filtersChanged
    ? !filterMenu?.deferBar
    : filterMenu !== null && filterMenu.anchor !== "header";

  const changeFilters = (next: Filter[]) => {
    onFiltersChange(next);
    if (
      filterMenu?.anchor &&
      !["header", "add", ...next.map((filter) => filter.key)].includes(filterMenu.anchor)
    )
      onFilterMenuChange(null);
  };

  const toggleFilterValue = (key: PropertyKey, value: string, negated = false) =>
    changeFilters(toggleValue(filters, key, value, negated));

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
    onFilterMenuChange(null);
  };

  const setFilterNegated = (key: PropertyKey, negated: boolean) =>
    onFiltersChange(
      filters.map((filter) => (filter.key === key ? { ...filter, negated } : filter)),
    );

  const actions =
    filtersChanged &&
    (onSaveView ? (
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
    ) : (
      <>
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          Clear
        </Button>
        <Button size="sm" onClick={onSaveAsNewView}>
          Save as view
        </Button>
      </>
    ));

  return (
    <div className="border-b">
      <FilterTriggerContext value={{ drawer: !desktop, popoverHandle, drawerHandle, triggerId }}>
        <div className="flex items-center gap-1.5 px-2 py-2.5 md:px-4">{children}</div>
        <Collapsible open={barVisible}>
          <CollapsiblePanel className="transition-[height,opacity] ease-snappy data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-opacity">
            <FilterBar
              filters={filters}
              orgPrs={orgPrs}
              viewer={viewer}
              actions={actions}
              onNegatedChange={setFilterNegated}
              onRemove={removeFilter}
            />
          </CollapsiblePanel>
        </Collapsible>
      </FilterTriggerContext>
      {desktop ? (
        <FilterMenu
          handle={popoverHandle}
          triggerId={filterMenu && triggerId(filterMenu.anchor)}
          onOpenChange={changeFilterMenu}
          orgPrs={orgPrs}
          scopedPrs={scopedPrs}
          filters={filters}
          viewer={viewer}
          onToggle={toggleFilterValue}
        />
      ) : (
        <FilterDrawer
          handle={drawerHandle}
          triggerId={filterMenu && triggerId(filterMenu.anchor)}
          onOpenChange={changeFilterMenu}
          orgPrs={orgPrs}
          scopedPrs={scopedPrs}
          filters={filters}
          viewer={viewer}
          onToggle={toggleFilterValue}
          onNegatedChange={setFilterNegated}
          onClear={(key) => changeFilters(filters.filter((filter) => filter.key !== key))}
          onClearAll={() => changeFilters([])}
        />
      )}
    </div>
  );
}

export function FilterButton() {
  return (
    <Hint label="Filter">
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
