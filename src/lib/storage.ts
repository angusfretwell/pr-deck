import { useLocalStorage, useTernaryDarkMode } from "usehooks-ts";
import type { Group, View } from "@/types";

export const TOKEN_KEY = "pr-deck:token";

export const useToken = () => useLocalStorage<string | null>(TOKEN_KEY, null);
export const useStoredViews = () => useLocalStorage<Record<string, View[]>>("pr-deck:views", {});
export const useGroup = () => useLocalStorage<Group>("pr-deck:group", "repo");
export const useLastPath = () => useLocalStorage<string | null>("pr-deck:last-path", null);
export const useColorMode = () => useTernaryDarkMode({ localStorageKey: "pr-deck:color-mode" });
export const useHideDrafts = () => useLocalStorage("pr-deck:hide-drafts", false);
export const useHiddenOwners = () => useLocalStorage<string[]>("pr-deck:hidden-owners", []);

type CollapsedGroupsByOwner = Record<string, string[]>;

export function parseCollapsedGroups(stored: string): CollapsedGroupsByOwner {
  const parsed: unknown = JSON.parse(stored);
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? (parsed as CollapsedGroupsByOwner)
    : {};
}

export function useCollapsedGroups(owner: string) {
  const [byOwner, setByOwner] = useLocalStorage<CollapsedGroupsByOwner>(
    "pr-deck:collapsed-groups",
    {},
    { deserializer: parseCollapsedGroups },
  );
  const setCollapsed = (collapsed: string[]) =>
    setByOwner((prev) => ({ ...prev, [owner]: collapsed }));
  return [byOwner[owner] ?? [], setCollapsed] as const;
}
