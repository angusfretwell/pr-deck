import type { ReactElement, ReactNode } from "react";

import { DrawerTrigger } from "@/components/ui/drawer";
import { PopoverTrigger } from "@/components/ui/popover";

import { useFilterContext } from "./filter-context";
import type { MenuAnchor } from "./filter-context";

interface FilterTriggerProps {
  anchor: MenuAnchor;
  render: ReactElement;
  children: ReactNode;
}

export function FilterTrigger({ anchor, ...props }: FilterTriggerProps) {
  const context = useFilterContext("FilterTrigger");
  const { drawer, drawerHandle, popoverHandle, triggerId } = context.meta;
  const id = triggerId(anchor);

  return drawer ? (
    <DrawerTrigger {...props} handle={drawerHandle} payload={anchor} id={id} />
  ) : (
    <PopoverTrigger
      {...props}
      handle={popoverHandle}
      payload={anchor}
      id={id}
    />
  );
}
