import { useMediaQuery } from "usehooks-ts";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Group, OpenIn, View } from "@/types";

export type ColorMode = "system" | "light" | "dark";

type GroupsByOwner = Record<string, string[]>;

export interface Preferences {
  token: string | null;
  views: Record<string, View[]>;
  group: Group;
  lastPath: string | null;
  colorMode: ColorMode;
  hideDrafts: boolean;
  hiddenOwners: string[];
  collapsedGroups: GroupsByOwner;
  starredGroups: GroupsByOwner;
  openIn: OpenIn;
}

const DEFAULTS: Preferences = {
  token: null,
  views: {},
  group: "repo",
  lastPath: null,
  colorMode: "system",
  hideDrafts: false,
  hiddenOwners: [],
  collapsedGroups: {},
  starredGroups: {},
  openIn: "github",
};

const STORAGE_KEY = "pr-deck:preferences";

const LEGACY_KEYS = {
  token: "pr-deck:token",
  views: "pr-deck:views",
  group: "pr-deck:group",
  lastPath: "pr-deck:last-path",
  colorMode: "pr-deck:color-mode",
  hideDrafts: "pr-deck:hide-drafts",
  hiddenOwners: "pr-deck:hidden-owners",
  collapsedGroups: "pr-deck:collapsed-groups",
  starredGroups: "pr-deck:starred-groups",
  openIn: "pr-deck:open-in",
} satisfies Record<keyof Preferences, string>;

function migrateLegacyKeys() {
  const entries = Object.entries(LEGACY_KEYS).flatMap(([field, key]) => {
    const stored = localStorage.getItem(key);

    if (stored === null) {
      return [];
    }

    const value: unknown = JSON.parse(stored);
    const ownerlessGroups = field.endsWith("Groups") && Array.isArray(value);

    return ownerlessGroups ? [] : [[field, value] as const];
  });

  if (entries.length === 0) {
    return null;
  }

  const migrated = JSON.stringify({ state: Object.fromEntries(entries) });
  localStorage.setItem(STORAGE_KEY, migrated);

  for (const key of Object.values(LEGACY_KEYS)) {
    localStorage.removeItem(key);
  }

  return migrated;
}

export const usePreferences = create<Preferences>()(
  persist(() => DEFAULTS, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => ({
      getItem: (name) => localStorage.getItem(name) ?? migrateLegacyKeys(),
      setItem: (name, value) => {
        localStorage.setItem(name, value);
      },
      removeItem: (name) => {
        localStorage.removeItem(name);
      },
    })),
  })
);

export function syncPreferencesAcrossTabs() {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      void usePreferences.persist.rehydrate();
    }
  });
}

const NO_GROUPS: string[] = [];

type GroupsField = "collapsedGroups" | "starredGroups";

export function useOwnerGroups(field: GroupsField, owner: string) {
  return usePreferences((state) => state[field][owner] ?? NO_GROUPS);
}

export function setOwnerGroups(
  field: GroupsField,
  owner: string,
  groups: string[]
) {
  usePreferences.setState((state) => ({
    [field]: { ...state[field], [owner]: groups },
  }));
}

export const GROUPS: { value: Group; label: string }[] = [
  { value: "repo", label: "Repository" },
  { value: "author", label: "Author" },
  { value: "none", label: "No grouping" },
];

export const THEMES: { value: ColorMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function useDarkMode() {
  const colorMode = usePreferences((state) => state.colorMode);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return colorMode === "dark" || (colorMode === "system" && prefersDark);
}
