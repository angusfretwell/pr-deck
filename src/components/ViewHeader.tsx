import { ListFilterIcon } from "lucide-react";
import { type RefCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toggleValue } from "@/lib/filters";
import type { Filter, Group, PropertyKey, PullRequest, View } from "@/types";
import { DisplayMenu } from "./view-header/DisplayMenu";
import { FilterBar } from "./view-header/FilterBar";
import { FILTER_TRIGGER, FilterMenu } from "./view-header/FilterMenu";
import { Hint } from "./view-header/Hint";
import { ViewTabs } from "./view-header/ViewTabs";

export type MenuAnchor = "header" | "add" | number;

export interface FilterMenuState {
  anchor: MenuAnchor;
  propertyKey: PropertyKey | null;
  deferBar?: boolean;
}

export interface ViewHeaderProps {
  views: View[];
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  activeViewId: string | null;
  renamingViewId: string | null;
  onSelectView: (id: string | null) => void;
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
  onFilterMenuChange: (menu: FilterMenuState | null) => void;
  displayMenuOpen: boolean;
  onDisplayMenuOpenChange: (open: boolean) => void;
  group: Group;
  onGroupChange: (group: Group) => void;

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
  orgPrs,
  scopedPrs,
  viewer,
  ...tabs
}: ViewHeaderProps) {
  const anchors = useRef(new Map<MenuAnchor, HTMLElement>());
  const anchorRef =
    (anchor: MenuAnchor): RefCallback<HTMLElement> =>
    (element) => {
      if (element) anchors.current.set(anchor, element);
      return () => {
        anchors.current.delete(anchor);
      };
    };

  const toggleFilterMenu = (anchor: MenuAnchor) => {
    if (filterMenu?.anchor === anchor) return onFilterMenuChange(null);
    if (anchor === "header")
      return onFilterMenuChange({ anchor, propertyKey: null, deferBar: !filtersChanged });
    onFilterMenuChange({ anchor, propertyKey: anchor === "add" ? null : filters[anchor].key });
  };

  const barVisible = filtersChanged
    ? !filterMenu?.deferBar
    : filterMenu !== null && filterMenu.anchor !== "header";

  const toggleFilterValue = (key: PropertyKey, value: string) => {
    const next = toggleValue(filters, key, value);
    onFiltersChange(next);
    if (next.length < filters.length && typeof filterMenu?.anchor === "number")
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
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        <ViewTabs {...tabs} />
        <Hint label="Filter">
          <Button
            variant="outline"
            size="icon-sm"
            className="ms-auto shrink-0 rounded-full before:rounded-full data-pressed:bg-accent"
            aria-label="Filter"
            ref={anchorRef("header")}
            data-pressed={filterMenu?.anchor === "header" ? "" : undefined}
            {...{ [FILTER_TRIGGER]: "" }}
            onClick={() => toggleFilterMenu("header")}
          >
            <ListFilterIcon className="size-3.5 sm:size-3.5" />
          </Button>
        </Hint>
        <DisplayMenu
          open={displayMenuOpen}
          onOpenChange={onDisplayMenuOpenChange}
          group={group}
          onGroupChange={onGroupChange}
        />
      </div>
      {barVisible && (
        <FilterBar
          filters={filters}
          orgPrs={orgPrs}
          viewer={viewer}
          actions={actions}
          anchorRef={anchorRef}
          onToggleMenu={toggleFilterMenu}
          onNegate={negateFilter}
          onRemove={removeFilter}
        />
      )}
      <FilterMenu
        menu={filterMenu}
        anchorOf={(anchor) => anchors.current.get(anchor) ?? null}
        onClose={() => onFilterMenuChange(null)}
        orgPrs={orgPrs}
        scopedPrs={scopedPrs}
        filters={filters}
        viewer={viewer}
        onToggle={toggleFilterValue}
      />
    </div>
  );
}
