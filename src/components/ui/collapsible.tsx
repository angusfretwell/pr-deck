"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

import { cn } from "@/lib/utils";

export const Collapsible = ({ ...props }: CollapsiblePrimitive.Root.Props) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
);

export const CollapsibleTrigger = ({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) => (
  <CollapsiblePrimitive.Trigger
    className={className}
    data-slot="collapsible-trigger"
    {...props}
  />
);

export const CollapsiblePanel = ({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) => (
  <CollapsiblePrimitive.Panel
    className={cn(
      "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0",
      className
    )}
    data-slot="collapsible-panel"
    {...props}
  />
);

export { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

export { CollapsiblePanel as CollapsibleContent };
