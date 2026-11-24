import { createContext, use } from "react";

import type { Group } from "@/types";

export interface ShownColumns {
  repo: boolean;
  author: boolean;
  face: boolean;
}

export interface PrTableContextValue {
  shown: ShownColumns;
  group: Group;
  summary: boolean;
  now: number;
  onSelect: (id: string) => void;
}

export const PrTableContext = createContext<PrTableContextValue | null>(null);

export function usePrTable() {
  const context = use(PrTableContext);

  if (context === null) {
    throw new Error("usePrTable must be used within PrTable");
  }

  return context;
}

export function shownColumns(group: Group, summary: boolean) {
  return {
    repo: !summary && group !== "repo",
    author: !summary && group !== "author",
    face: summary && group !== "author",
  } satisfies ShownColumns;
}
