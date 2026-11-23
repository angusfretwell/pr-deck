import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import type { PersistQueryClientProviderProps } from "@tanstack/react-query-persist-client";

import { TOKEN_KEY } from "./storage";

const PERSISTED_QUERIES = new Set<unknown>(["session", "pull-requests"]);

export function shouldPersistQuery(query: Query) {
  return (
    PERSISTED_QUERIES.has(query.queryKey[0]) &&
    defaultShouldDehydrateQuery(query)
  );
}

export const queryClient = new QueryClient();

const persister = createAsyncStoragePersister({
  key: "pr-deck:query-cache",
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => {
      if (localStorage.getItem(TOKEN_KEY) !== null) {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  },
});

export const persistOptions: PersistQueryClientProviderProps["persistOptions"] =
  {
    persister,
    maxAge: 24 * 60 * 60_000,
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  };

export async function refetchRestoredQueries() {
  await queryClient.invalidateQueries();
}

export function clearQueryCache() {
  queryClient.clear();
  void persister.removeClient();
}

export function resetQueryCache() {
  void persister.removeClient();
  void queryClient.invalidateQueries({ queryKey: ["session"] });
  void queryClient.resetQueries({
    predicate: (query) => query.queryKey[0] !== "session",
  });
}
