import { create } from "zustand";

export const useShortcutsOpen = create<boolean>(() => false);

export function setShortcutsOpen(open: boolean) {
  useShortcutsOpen.setState(open, true);
}

export function openShortcuts() {
  setShortcutsOpen(true);
}
