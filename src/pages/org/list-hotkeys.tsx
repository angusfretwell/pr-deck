import { useHotkeys } from "@tanstack/react-hotkeys";
import type { HotkeyMeta } from "@tanstack/react-hotkeys";
import { useLocation } from "wouter";

import { openSearch } from "@/features/search/lib/search-store";
import { setKeyboardViewHref } from "@/features/views/lib/keyboard-view-store";
import { HOTKEYS } from "@/features/shortcuts/lib/hotkeys";
import type { SHORTCUT_GROUPS } from "@/features/shortcuts/lib/hotkeys";
import { useShortcutsOpen } from "@/features/shortcuts/lib/shortcuts-store";
import { openPullRequest } from "@/lib/open-in";
import { usePreferences } from "@/lib/preferences";
import {
  changeFilterMenu,
  setDisplayMenuOpen,
  togglePalette,
  useOverlays,
} from "@/pages/org/lib/overlays-store";

import { useOrgList } from "./org-list-context";

function cycle<T>(items: T[], current: T, offset: 1 | -1) {
  return items[(items.indexOf(current) + offset + items.length) % items.length];
}

function meta(group: (typeof SHORTCUT_GROUPS)[number], name: string) {
  return { group, name } satisfies HotkeyMeta;
}

function useOpenOverlays() {
  const { filterMenu, displayMenuOpen, paletteOpen } = useOverlays();
  const shortcutsOpen = useShortcutsOpen();

  return {
    paletteOpen,
    shortcutsOpen,
    menuOpen: filterMenu !== null || displayMenuOpen,
    idle: !filterMenu && !displayMenuOpen && !paletteOpen && !shortcutsOpen,
  };
}

export function CycleHotkeys() {
  const {
    state: { views },
    meta: { owner, owners },
  } = useOrgList();

  const [, navigate] = useLocation();
  const { idle } = useOpenOverlays();

  function cycleView(offset: 1 | -1) {
    return () => {
      const viewIds = [null, ...views.list.map((view) => view.id)];

      const href = views.hrefFor(
        cycle(viewIds, views.active?.id ?? null, offset)
      );

      setKeyboardViewHref(href);
      navigate(href);
    };
  }

  function cycleOwner(offset: 1 | -1) {
    return () => {
      const logins = owners.map((account) => account.login);
      navigate(`/${cycle(logins, owner, offset)}`);
    };
  }

  useHotkeys([
    {
      hotkey: "[",
      callback: cycleView(-1),
      options: {
        enabled: idle && views.list.length > 0,
        meta: meta("Views", "Previous view"),
      },
    },
    {
      hotkey: "]",
      callback: cycleView(1),
      options: {
        enabled: idle && views.list.length > 0,
        meta: meta("Views", "Next view"),
      },
    },
    {
      hotkey: "{",
      callback: cycleOwner(-1),
      options: {
        enabled: idle && owners.length > 1,
        meta: meta("Views", "Previous organisation"),
      },
    },
    {
      hotkey: "}",
      callback: cycleOwner(1),
      options: {
        enabled: idle && owners.length > 1,
        meta: meta("Views", "Next organisation"),
      },
    },
  ]);

  return null;
}

export function ListHotkeys() {
  const {
    state: { views, list, selection, hideDrafts },
    actions: { act },
    meta: { desktop },
  } = useOrgList();

  const { idle, paletteOpen, shortcutsOpen, menuOpen } = useOpenOverlays();
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

  const next = meta("Pull requests", "Next pull request");
  const previous = meta("Pull requests", "Previous pull request");
  const preview = meta("Pull requests", "Toggle preview");
  const search = meta("General", "Search pull requests");

  useHotkeys(
    [
      {
        hotkey: HOTKEYS.palette,
        callback: togglePalette,
        options: {
          enabled: !menuOpen && !shortcutsOpen,
          meta: meta("General", "Command palette"),
        },
      },
      {
        hotkey: "Mod+F",
        callback: openSearch,
        options: { enabled: !paletteOpen && !shortcutsOpen, meta: search },
      },
      {
        hotkey: HOTKEYS.search,
        callback: openSearch,
        options: { enabled: idle, meta: search },
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
        options: {
          preventDefault: false,
          enabled: !paletteOpen && !shortcutsOpen,
          meta: meta("Pull requests", "Close preview or clear selection"),
        },
      },
      {
        hotkey: HOTKEYS.filter,
        callback: () => {
          changeFilterMenu("header", views.filtersChanged);
        },
        options: { enabled: idle, meta: meta("Views", "Filter") },
      },
      {
        hotkey: HOTKEYS.display,
        callback: () => {
          setDisplayMenuOpen(true);
        },
        options: { enabled: idle, meta: meta("Views", "Display options") },
      },
      {
        hotkey: HOTKEYS.drafts,
        callback: () => {
          usePreferences.setState({ hideDrafts: !hideDrafts });
        },
        options: {
          enabled: idle && desktop,
          meta: meta("Views", "Show or hide drafts"),
        },
      },
      {
        hotkey: "J",
        callback: move(1),
        options: { enabled: idle && hasRows, meta: next },
      },
      {
        hotkey: "ArrowDown",
        callback: move(1),
        options: { enabled: idle && hasRows, meta: next },
      },
      {
        hotkey: "K",
        callback: move(-1),
        options: { enabled: idle && hasRows, meta: previous },
      },
      {
        hotkey: "ArrowUp",
        callback: move(-1),
        options: { enabled: idle && hasRows, meta: previous },
      },
      {
        hotkey: "Enter",
        callback: togglePreview,
        options: { enabled: idle && navigable, meta: preview },
      },
      {
        hotkey: "Space",
        callback: togglePreview,
        options: { enabled: idle && navigable, meta: preview },
      },
      {
        hotkey: "O",
        callback: () => {
          if (list.selected) {
            openPullRequest(list.selected.url);
          }
        },
        options: {
          enabled: idle && !!list.selected,
          preventDefault: false,
          meta: meta("Pull requests", "Open pull request"),
        },
      },
    ],
    { ignoreDefaultPrevented: true }
  );

  return null;
}
