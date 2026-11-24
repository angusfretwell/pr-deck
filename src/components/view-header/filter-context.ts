import { createContext, use } from "react";

import type { DrawerPrimitive } from "@/components/ui/drawer";
import type { PopoverPrimitive } from "@/components/ui/popover";
import type { Filter, PropertyKey, PullRequest } from "@/types";

export type MenuAnchor = "header" | "add" | PropertyKey;

export interface FilterState {
  filters: Filter[];
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
}

export interface FilterActions {
  toggle: (key: PropertyKey, value: string, negated?: boolean) => void;
  remove: (index: number) => void;
  setNegated: (key: PropertyKey, negated: boolean) => void;
  clear: (key: PropertyKey) => void;
  clearAll: () => void;
  changeMenu: (open: boolean, trigger: Element | undefined) => void;
}

export interface FilterMeta {
  viewer: string;
  drawer: boolean;
  popoverHandle: PopoverPrimitive.Handle<MenuAnchor>;
  drawerHandle: DrawerPrimitive.Handle<MenuAnchor>;
  triggerId: (anchor: MenuAnchor) => string;
  openTriggerId: string | null;
}

export interface FilterContextValue {
  state: FilterState;
  actions: FilterActions;
  meta: FilterMeta;
}

export const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilterContext(consumer: string) {
  const context = use(FilterContext);

  if (!context) {
    throw new Error(`${consumer} must be rendered inside ViewHeader`);
  }

  return context;
}
