import {
  FoldIcon,
  GitPullRequestDraftIcon,
  PaintbrushIcon,
  RowsIcon,
  UnfoldIcon,
} from "@primer/octicons-react";

import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { Check } from "@/components/command-palette/parts";
import { CommandShortcut } from "@/components/ui/command";
import { HOTKEYS } from "@/features/shortcuts/lib/hotkeys";
import { GROUPS, THEMES, usePreferences } from "@/lib/preferences";
import { useOrgList } from "@/pages/org/org-list-context";

export function useDisplayCommands() {
  const {
    state: { group, groupsCollapsed, hideDrafts },
    actions: { toggleAllGroups },
    meta: { desktop },
  } = useOrgList();

  const colorMode = usePreferences((state) => state.colorMode);

  return [
    ...GROUPS.map(({ value, label }) => ({
      id: `group:${value}`,
      keywords: `group by ${label}`,
      icon: <RowsIcon />,
      label:
        value === "none" ? "Don't group" : `Group by ${label.toLowerCase()}`,
      end: group === value ? <Check /> : undefined,
      run: () => {
        usePreferences.setState({ group: value });
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
            end: <CommandShortcut>{HOTKEYS.drafts}</CommandShortcut>,
            run: () => {
              usePreferences.setState({ hideDrafts: !hideDrafts });
            },
          },
        ]
      : []),
    ...THEMES.map(({ value, label }) => ({
      id: `theme:${value}`,
      keywords: `theme appearance ${label} mode`,
      icon: <PaintbrushIcon />,
      label: `${label} theme`,
      end: colorMode === value ? <Check /> : undefined,
      run: () => {
        usePreferences.setState({ colorMode: value });
      },
    })),
  ] satisfies PaletteCommand[];
}
