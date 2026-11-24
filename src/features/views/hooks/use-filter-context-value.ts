import { useId, useMemo } from "react";

import { DrawerCreateHandle as createDrawerHandle } from "@/components/ui/drawer";
import { PopoverCreateHandle as createPopoverHandle } from "@/components/ui/popover";
import type {
  FilterContextValue,
  MenuAnchor,
} from "@/features/views/filter-context";
import { toggleValue } from "@/features/views/lib/filters";
import { useDesktop } from "@/hooks/use-desktop";
import type { Filter, PropertyKey, PullRequest } from "@/types";

interface UseFilterContextValueOptions {
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  openAnchor: MenuAnchor | null;
  onFilterMenuChange: (anchor: MenuAnchor | null) => void;
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  viewer: string;
}

function anchorsFor(current: Filter[]) {
  return [
    "header",
    "add",
    ...current.map((filter) => filter.key),
  ] satisfies MenuAnchor[];
}

export function useFilterContextValue({
  filters,
  onFiltersChange,
  openAnchor,
  onFilterMenuChange,
  orgPrs,
  scopedPrs,
  viewer,
}: UseFilterContextValueOptions) {
  const desktop = useDesktop();
  const popoverHandle = useMemo(() => createPopoverHandle<MenuAnchor>(), []);
  const drawerHandle = useMemo(() => createDrawerHandle<MenuAnchor>(), []);
  const triggerIdPrefix = useId();

  return useMemo(() => {
    function triggerId(anchor: MenuAnchor) {
      return `${triggerIdPrefix}${anchor}`;
    }

    function changeFilters(next: Filter[]) {
      onFiltersChange(next);

      const anchorRemoved =
        openAnchor !== null && !anchorsFor(next).includes(openAnchor);

      if (anchorRemoved) {
        onFilterMenuChange(null);
      }
    }

    return {
      state: { filters, orgPrs, scopedPrs },
      actions: {
        toggle(key: PropertyKey, value: string, negated = false) {
          changeFilters(toggleValue(filters, key, value, negated));
        },
        remove(index) {
          onFiltersChange(filters.filter((_, i) => i !== index));
          onFilterMenuChange(null);
        },
        setNegated(key, negated) {
          onFiltersChange(
            filters.map((filter) =>
              filter.key === key ? { ...filter, negated } : filter
            )
          );
        },
        clear(key) {
          changeFilters(filters.filter((filter) => filter.key !== key));
        },
        clearAll() {
          changeFilters([]);
        },
        changeMenu(open, trigger) {
          if (!open) {
            onFilterMenuChange(null);

            return;
          }

          const anchor = anchorsFor(filters).find(
            (candidate) => triggerId(candidate) === trigger?.id
          );

          if (anchor) {
            onFilterMenuChange(anchor);
          }
        },
      },
      meta: {
        viewer,
        drawer: !desktop,
        popoverHandle,
        drawerHandle,
        triggerId,
        openTriggerId: openAnchor && triggerId(openAnchor),
      },
    } satisfies FilterContextValue;
  }, [
    filters,
    onFiltersChange,
    openAnchor,
    onFilterMenuChange,
    orgPrs,
    scopedPrs,
    viewer,
    desktop,
    popoverHandle,
    drawerHandle,
    triggerIdPrefix,
  ]);
}
