import type { Hotkey } from "@tanstack/react-hotkeys";

export const HOTKEYS = {
  palette: "Mod+K",
  search: "/",
  filter: "F",
  display: "D",
  drafts: "R",
  shortcuts: "?",
} as const satisfies Record<string, Hotkey>;

export const SHORTCUT_GROUPS = ["General", "Views", "Pull requests"] as const;
