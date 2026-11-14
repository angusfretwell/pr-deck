import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import type { Group } from "@/types";
import { Hint } from "./Hint";

const GROUPS: { value: Group; label: string }[] = [
  { value: "repo", label: "Repository" },
  { value: "author", label: "Author" },
  { value: "none", label: "No grouping" },
];

interface DisplayMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onGroupChange: (group: Group) => void;
}

export function DisplayMenu({ open, onOpenChange, group, onGroupChange }: DisplayMenuProps) {
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <Hint label="Display">
        <MenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full before:rounded-full data-popup-open:bg-accent"
              aria-label="Display"
            />
          }
        >
          <SlidersHorizontalIcon className="size-3.5 sm:size-3.5" />
        </MenuTrigger>
      </Hint>
      <MenuPopup align="end" className="min-w-40">
        <MenuGroup>
          <MenuGroupLabel>Group by</MenuGroupLabel>
          <MenuRadioGroup value={group} onValueChange={(value: Group) => onGroupChange(value)}>
            {GROUPS.map(({ value, label }) => (
              <MenuRadioItem key={value} value={value} closeOnClick>
                {label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
