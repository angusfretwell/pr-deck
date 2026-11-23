import { use } from "react";
import type { ReactElement, ReactNode } from "react";

import { DrawerTrigger } from "@/components/ui/drawer";
import { PopoverTrigger } from "@/components/ui/popover";

import { FilterTriggerContext } from "./filter-trigger-context";
import type { MenuAnchor } from "./filter-trigger-context";

interface FilterTriggerProps {
  anchor: MenuAnchor;
  render: ReactElement;
  children: ReactNode;
}

export function FilterTrigger({ anchor, ...props }: FilterTriggerProps) {
  const context = use(FilterTriggerContext);

  if (!context) {
    throw new Error("FilterTrigger must be rendered inside ViewHeader");
  }

  const id = context.triggerId(anchor);

  return context.drawer ? (
    <DrawerTrigger
      {...props}
      handle={context.drawerHandle}
      payload={anchor}
      id={id}
    />
  ) : (
    <PopoverTrigger
      {...props}
      handle={context.popoverHandle}
      payload={anchor}
      id={id}
    />
  );
}
