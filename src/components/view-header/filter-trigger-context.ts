import { createContext } from "react";

import type { DrawerPrimitive } from "@/components/ui/drawer";
import type { PopoverPrimitive } from "@/components/ui/popover";
import type { PropertyKey } from "@/types";

export type MenuAnchor = "header" | "add" | PropertyKey;

export interface FilterTriggerContextValue {
  drawer: boolean;
  popoverHandle: PopoverPrimitive.Handle<MenuAnchor>;
  drawerHandle: DrawerPrimitive.Handle<MenuAnchor>;
  triggerId: (anchor: MenuAnchor) => string;
}

export const FilterTriggerContext =
  createContext<FilterTriggerContextValue | null>(null);
