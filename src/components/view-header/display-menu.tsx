import { FoldIcon, SlidersIcon, UnfoldIcon } from "@primer/octicons-react";
import {
  ResponsiveMenu,
  ResponsiveMenuGroup,
  ResponsiveMenuGroupLabel,
  ResponsiveMenuItem,
  ResponsiveMenuPopup,
  ResponsiveMenuRadioGroup,
  ResponsiveMenuRadioItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/components/responsive-menu";
import { Button } from "@/components/ui/button";
import { GROUPS } from "@/lib/pr-list";
import type { Group } from "@/types";
import { Hint } from "./hint";

interface DisplayMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onGroupChange: (group: Group) => void;
  allGroupsCollapsed: boolean;
  onToggleAllGroups?: () => void;
}

export function DisplayMenu({
  open,
  onOpenChange,
  group,
  onGroupChange,
  allGroupsCollapsed,
  onToggleAllGroups,
}: DisplayMenuProps) {
  return (
    <ResponsiveMenu open={open} onOpenChange={onOpenChange}>
      <Hint label="Display">
        <ResponsiveMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full before:rounded-full data-popup-open:bg-accent"
              aria-label="Display"
            />
          }
        >
          <SlidersIcon className="size-3.5" />
        </ResponsiveMenuTrigger>
      </Hint>
      <ResponsiveMenuPopup align="end" className="min-w-40">
        <ResponsiveMenuGroup>
          <ResponsiveMenuGroupLabel>Group by</ResponsiveMenuGroupLabel>
          <ResponsiveMenuRadioGroup value={group} onValueChange={onGroupChange}>
            {GROUPS.map(({ value, label }) => (
              <ResponsiveMenuRadioItem key={value} value={value} closeOnClick>
                {label}
              </ResponsiveMenuRadioItem>
            ))}
          </ResponsiveMenuRadioGroup>
        </ResponsiveMenuGroup>
        {onToggleAllGroups && (
          <>
            <ResponsiveMenuSeparator />
            <ResponsiveMenuItem onClick={onToggleAllGroups}>
              {allGroupsCollapsed ? <UnfoldIcon /> : <FoldIcon />}
              {allGroupsCollapsed ? "Expand all" : "Collapse all"}
            </ResponsiveMenuItem>
          </>
        )}
      </ResponsiveMenuPopup>
    </ResponsiveMenu>
  );
}
