import { useHotkeys } from "@tanstack/react-hotkeys";

import { useOrgList } from "@/components/org/org-list-context";
import { useOrgOverlays } from "@/components/org/org-overlays-context";
import { useSearch } from "@/components/search-context";

export function ListHotkeys() {
  const {
    state: { list, selection, hideDrafts },
    actions: { act, setHideDrafts },
    meta: { desktop },
  } = useOrgList();

  const {
    state: { filterMenu, displayMenuOpen, paletteOpen },
    actions: { changeFilterMenu, togglePalette },
  } = useOrgOverlays();

  const {
    actions: { open: openSearch },
  } = useSearch();

  const idle = !filterMenu && !displayMenuOpen && !paletteOpen;
  const hasRows = list.order.length > 0;
  const navigable = list.order.includes(selection.selectedId ?? "");

  function move(delta: 1 | -1) {
    return () => {
      act({ type: "move", delta });
    };
  }

  function togglePreview() {
    act({ type: "togglePreview" });
  }

  useHotkeys(
    [
      {
        hotkey: "Mod+K",
        callback: togglePalette,
        options: { enabled: !filterMenu && !displayMenuOpen },
      },
      {
        hotkey: "Mod+F",
        callback: openSearch,
        options: { enabled: !paletteOpen },
      },
      {
        hotkey: "Escape",
        callback: ({ target }) => {
          if (
            target instanceof HTMLElement &&
            target.matches("input, textarea, select")
          ) {
            target.blur();
          } else {
            act({ type: "escape" });
          }
        },
        options: { preventDefault: false, enabled: !paletteOpen },
      },
      { hotkey: "/", callback: openSearch, options: { enabled: idle } },
      {
        hotkey: "F",
        callback: () => {
          changeFilterMenu("header");
        },
        options: { enabled: idle },
      },
      {
        hotkey: "D",
        callback: () => {
          setHideDrafts(!hideDrafts);
        },
        options: { enabled: idle && desktop },
      },
      { hotkey: "J", callback: move(1), options: { enabled: idle && hasRows } },
      {
        hotkey: "ArrowDown",
        callback: move(1),
        options: { enabled: idle && hasRows },
      },
      {
        hotkey: "K",
        callback: move(-1),
        options: { enabled: idle && hasRows },
      },
      {
        hotkey: "ArrowUp",
        callback: move(-1),
        options: { enabled: idle && hasRows },
      },
      {
        hotkey: "Enter",
        callback: togglePreview,
        options: { enabled: idle && navigable },
      },
      {
        hotkey: "Space",
        callback: togglePreview,
        options: { enabled: idle && navigable },
      },
      {
        hotkey: "O",
        callback: () => {
          if (list.selected) {
            window.open(list.selected.url, "_blank", "noopener");
          }
        },
        options: { enabled: idle && !!list.selected, preventDefault: false },
      },
    ],
    { ignoreDefaultPrevented: true }
  );

  return null;
}
