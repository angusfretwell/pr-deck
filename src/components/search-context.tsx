import { createContext, use, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

export interface SearchState {
  query: string;
  visible: boolean;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  open: () => void;
  close: () => void;
  dismiss: () => void;
}

export interface SearchMeta {
  inputRef: RefObject<HTMLInputElement | null>;
}

export interface SearchContextValue {
  state: SearchState;
  actions: SearchActions;
  meta: SearchMeta;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<SearchActions>(
    () => ({
      setQuery,
      open() {
        setOpened(true);
        inputRef.current?.focus();
      },
      close() {
        setOpened(false);
      },
      dismiss() {
        setQuery("");
        setOpened(false);
      },
    }),
    []
  );

  const value = useMemo(
    () => ({
      state: { query, visible: opened || query !== "" },
      actions,
      meta: { inputRef },
    }),
    [query, opened, actions]
  );

  return <SearchContext value={value}>{children}</SearchContext>;
}

export function useSearch() {
  const context = use(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }

  return context;
}
