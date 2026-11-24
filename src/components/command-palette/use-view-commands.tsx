import { BookmarkIcon } from "@primer/octicons-react";
import { useLocation } from "wouter";

import { useOrgList } from "@/components/org/org-list-context";
import { ALL_OPEN_NAME } from "@/lib/views";

import { Check, Count } from "./parts";
import type { PaletteCommand } from "./types";

export function useViewCommands() {
  const {
    state: { views, viewCounts, allOpenCount },
  } = useOrgList();

  const [, navigate] = useLocation();
  const activeViewId = views.active?.id ?? null;

  return [
    { id: null, name: ALL_OPEN_NAME, count: allOpenCount },
    ...views.list.map((view) => ({
      id: view.id,
      name: view.name,
      count: viewCounts[view.id],
    })),
  ].map((view) => ({
    id: `view:${view.id}`,
    keywords: `go to view ${view.name}`,
    icon: <BookmarkIcon />,
    label: view.name,
    end: activeViewId === view.id ? <Check /> : <Count>{view.count}</Count>,
    run: () => {
      navigate(views.hrefFor(view.id));
    },
  })) satisfies PaletteCommand[];
}
