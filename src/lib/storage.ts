import { useLocalStorage, useTernaryDarkMode } from "usehooks-ts";
import type { TernaryDarkMode } from "usehooks-ts";

import type { Group, OpenIn, View } from "@/types";

export const TOKEN_KEY = "pr-deck:token";

export function useToken() {
  return useLocalStorage<string | null>(TOKEN_KEY, null);
}

export function useStoredViews() {
  return useLocalStorage<Record<string, View[]>>("pr-deck:views", {});
}

export function useGroup() {
  return useLocalStorage<Group>("pr-deck:group", "repo");
}

export function useLastPath() {
  return useLocalStorage<string | null>("pr-deck:last-path", null);
}

export const THEMES: { value: TernaryDarkMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function useColorMode() {
  return useTernaryDarkMode({ localStorageKey: "pr-deck:color-mode" });
}

export function useHideDrafts() {
  return useLocalStorage("pr-deck:hide-drafts", false);
}

export function useHiddenOwners() {
  return useLocalStorage<string[]>("pr-deck:hidden-owners", []);
}

type GroupsByOwner = Record<string, string[]>;

export function parseGroupsByOwner(stored: string) {
  const parsed: unknown = JSON.parse(stored);

  const groupsByOwner: GroupsByOwner =
    parsed instanceof Object && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed))
      : {};

  return groupsByOwner;
}

function useGroupsByOwner(key: string, owner: string) {
  const [byOwner, setByOwner] = useLocalStorage<GroupsByOwner>(
    key,
    {},
    { deserializer: parseGroupsByOwner }
  );

  function setGroups(groups: string[]) {
    setByOwner((prev) => ({ ...prev, [owner]: groups }));
  }

  return [byOwner[owner] ?? [], setGroups] as const;
}

export function useCollapsedGroups(owner: string) {
  return useGroupsByOwner("pr-deck:collapsed-groups", owner);
}

export function useStarredGroups(owner: string) {
  return useGroupsByOwner("pr-deck:starred-groups", owner);
}

export function useOpenIn() {
  return useLocalStorage<OpenIn>("pr-deck:open-in", "github");
}
