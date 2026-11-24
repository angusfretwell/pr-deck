import {
  FoldIcon,
  GitPullRequestDraftIcon,
  PaintbrushIcon,
  RowsIcon,
  UnfoldIcon,
} from "@primer/octicons-react";

import { useOrgList } from "@/components/org/org-list-context";
import { CommandShortcut } from "@/components/ui/command";
import { GROUPS } from "@/lib/pr-list";
import { THEMES, useColorMode } from "@/lib/storage";

import { Check } from "./parts";
import type { PaletteCommand } from "./types";

export function useDisplayCommands() {
  const {
    state: { group, groupsCollapsed, hideDrafts },
    actions: { setGroup, toggleAllGroups, setHideDrafts },
    meta: { desktop },
  } = useOrgList();

  const { ternaryDarkMode, setTernaryDarkMode } = useColorMode();

  return [
    ...GROUPS.map(({ value, label }) => ({
      id: `group:${value}`,
      keywords: `group by ${label}`,
      icon: <RowsIcon />,
      label:
        value === "none" ? "Don't group" : `Group by ${label.toLowerCase()}`,
      end: group === value ? <Check /> : undefined,
      run: () => {
        setGroup(value);
      },
    })),
    ...(toggleAllGroups
      ? [
          {
            id: "groups:toggle-all",
            keywords: "expand collapse fold unfold all groups",
            icon: groupsCollapsed ? <UnfoldIcon /> : <FoldIcon />,
            label: groupsCollapsed
              ? "Expand all groups"
              : "Collapse all groups",
            run: toggleAllGroups,
          },
        ]
      : []),
    ...(desktop
      ? [
          {
            id: "drafts",
            keywords: "drafts hide show toggle",
            icon: <GitPullRequestDraftIcon />,
            label: hideDrafts ? "Show drafts" : "Hide drafts",
            end: <CommandShortcut>D</CommandShortcut>,
            run: () => {
              setHideDrafts(!hideDrafts);
            },
          },
        ]
      : []),
    ...THEMES.map(({ value, label }) => ({
      id: `theme:${value}`,
      keywords: `theme appearance ${label} mode`,
      icon: <PaintbrushIcon />,
      label: `${label} theme`,
      end: ternaryDarkMode === value ? <Check /> : undefined,
      run: () => {
        setTernaryDarkMode(value);
      },
    })),
  ] satisfies PaletteCommand[];
}
