import { createRef } from "react";
import { create } from "zustand";

export const searchInputRef = createRef<HTMLInputElement>();

export const useSearch = create(() => ({ query: "", opened: false }));

export function useSearchVisible() {
  return useSearch((state) => state.opened || state.query !== "");
}

export function setSearchQuery(query: string) {
  useSearch.setState({ query });
}

export function openSearch() {
  useSearch.setState({ opened: true });
  searchInputRef.current?.focus();
}

export function closeSearch() {
  useSearch.setState({ opened: false });
}

export function dismissSearch() {
  useSearch.setState({ query: "", opened: false });
}
