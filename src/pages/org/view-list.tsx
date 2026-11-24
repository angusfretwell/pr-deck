import { derivePrList, NO_SELECTION } from "@/features/pr-table/lib/pr-list";
import type { PrList } from "@/features/pr-table/lib/pr-list";
import { PrTable } from "@/features/pr-table/pr-table";
import type { Views } from "@/features/views/lib/views";

import { LoadingRows } from "./list-states";
import { useOrgList } from "./org-list-context";
import type { SwipeNeighbour } from "./view-swipe";

interface ViewListProps {
  list: PrList;
  selectedId: string | null;
}

export function ViewList({ list: shown, selectedId }: ViewListProps) {
  const {
    state: { list, group, now, deferredQuery },
    actions: { select, showAll, clearSearch, toggleGroup, toggleStar },
  } = useOrgList();

  if (shown.statusPending) {
    return <LoadingRows />;
  }

  return (
    <PrTable
      groups={shown.groups}
      group={group}
      compact={!!list.previewed}
      selectedId={selectedId}
      onSelect={select}
      now={now}
      query={deferredQuery}
      onShowAll={showAll}
      onClearSearch={clearSearch}
      onToggleGroup={toggleGroup}
      onToggleStar={toggleStar}
    />
  );
}

function neighbourViewId(views: Views, offset: 1 | -1) {
  const viewIds = [null, ...views.list.map((view) => view.id)];

  return viewIds[viewIds.indexOf(views.active?.id ?? null) + offset];
}

export function useSwipeNeighbours() {
  const {
    state: { views, listInput, allPrs },
    meta: { desktop },
  } = useOrgList();

  function neighbour(offset: 1 | -1) {
    if (desktop || allPrs.length === 0) {
      return null;
    }

    const id = neighbourViewId(views, offset);

    if (id === undefined) {
      return null;
    }

    const filters = views.list.find((view) => view.id === id)?.filters ?? [];

    return {
      href: views.hrefFor(id),
      content: (
        <ViewList
          list={derivePrList({
            ...listInput,
            filters,
            selection: NO_SELECTION,
          })}
          selectedId={null}
        />
      ),
    } satisfies SwipeNeighbour;
  }

  return { previous: neighbour(-1), next: neighbour(1) };
}
