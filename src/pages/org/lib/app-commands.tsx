import { KeyAsteriskIcon, SyncIcon } from "@primer/octicons-react";

import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { CommandShortcut } from "@/components/ui/command";
import { HOTKEYS } from "@/features/shortcuts/lib/hotkeys";
import { openShortcuts } from "@/features/shortcuts/lib/shortcuts-store";
import { resetQueryCache } from "@/lib/query-cache";

export const APP_COMMANDS: PaletteCommand[] = [
  {
    id: "cache:clear",
    keywords: "clear cache reload refresh refetch data",
    icon: <SyncIcon />,
    label: "Clear cache",
    run: resetQueryCache,
  },
  {
    id: "shortcuts",
    keywords: "keyboard shortcuts hotkeys keys help",
    icon: <KeyAsteriskIcon />,
    label: "Keyboard shortcuts",
    end: <CommandShortcut>{HOTKEYS.shortcuts}</CommandShortcut>,
    run: openShortcuts,
  },
];
