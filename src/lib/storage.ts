import { useLocalStorage, useTernaryDarkMode } from "usehooks-ts";
import type { TernaryDarkMode } from "usehooks-ts";

import type { Group, OpenIn, View } from "@/types";

export const TOKEN_KEY = "pr-deck:token";

export const useToken = () => useLocalStorage<string | null>(TOKEN_KEY, null);

export const useStoredViews = () =>
  useLocalStorage<Record<string, View[]>>("pr-deck:views", {});

export const useGroup = () => useLocalStorage<Group>("pr-deck:group", "repo");

export const useLastPath = () =>
  useLocalStorage<string | null>("pr-deck:last-path", null);

export const THEMES: { value: TernaryDarkMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const useColorMode = () =>
  useTernaryDarkMode({ localStorageKey: "pr-deck:color-mode" });

export const useHideDrafts = () =>
  useLocalStorage("pr-deck:hide-drafts", false);

export const useHiddenOwners = () =>
  useLocalStorage<string[]>("pr-deck:hidden-owners", []);

type GroupsByOwner = Record<string, string[]>;

export const parseGroupsByOwner = (stored: string) => {
  const parsed: unknown = JSON.parse(stored);

  const groupsByOwner: GroupsByOwner =
    parsed instanceof Object && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed))
      : {};

  return groupsByOwner;
};

const useGroupsByOwner = (key: string, owner: string) => {
  const [byOwner, setByOwner] = useLocalStorage<GroupsByOwner>(
    key,
    {},
    { deserializer: parseGroupsByOwner }
  );

  const setGroups = (groups: string[]) => {
    setByOwner((prev) => ({ ...prev, [owner]: groups }));
  };

  return [byOwner[owner] ?? [], setGroups] as const;
};

export const useCollapsedGroups = (owner: string) =>
  useGroupsByOwner("pr-deck:collapsed-groups", owner);

export const useStarredGroups = (owner: string) =>
  useGroupsByOwner("pr-deck:starred-groups", owner);

export const useOpenIn = () =>
  useLocalStorage<OpenIn>("pr-deck:open-in", "github");
