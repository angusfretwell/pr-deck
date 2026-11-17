import { use, type ComponentProps } from "react";
import { DrawerTrigger } from "@/components/ui/drawer";
import { PopoverTrigger } from "@/components/ui/popover";
import { FilterTriggerContext, type MenuAnchor } from "./filter-trigger-context";

type FilterTriggerProps = Omit<
  ComponentProps<typeof PopoverTrigger>,
  "handle" | "payload" | "id"
> & { anchor: MenuAnchor };

export function FilterTrigger({ anchor, ...props }: FilterTriggerProps) {
  const context = use(FilterTriggerContext);
  if (!context) throw new Error("FilterTrigger must be rendered inside ViewHeader");
  const id = context.triggerId(anchor);
  return context.drawer ? (
    <DrawerTrigger {...props} handle={context.drawerHandle} payload={anchor} id={id} />
  ) : (
    <PopoverTrigger {...props} handle={context.popoverHandle} payload={anchor} id={id} />
  );
}
