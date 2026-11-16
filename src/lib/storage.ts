import { useLocalStorage } from "usehooks-ts";
import type { Group, View } from "@/types";

export const TOKEN_KEY = "pr-deck:token";

export const useToken = () => useLocalStorage<string | null>(TOKEN_KEY, null);
export const useStoredViews = () => useLocalStorage<Record<string, View[]>>("pr-deck:views", {});
export const useGroup = () => useLocalStorage<Group>("pr-deck:group", "repo");
export const useLastPath = () => useLocalStorage<string | null>("pr-deck:last-path", null);
export const useHiddenOwners = () => useLocalStorage<string[]>("pr-deck:hidden-owners", []);
