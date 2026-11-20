import { AlertIcon, GitPullRequestIcon, InfoIcon } from "@primer/octicons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useEventCallback, useInterval, useResizeObserver } from "usehooks-ts";
import { Redirect, useLocation } from "wouter";
import { Preview, PreviewDrawer } from "@/components/preview";
import { PrTable } from "@/components/pr-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterButton, ViewHeader, type FilterMenuState } from "@/components/view-header";
import { DisplayMenu } from "@/components/view-header/display-menu";
import { DraftsToggle } from "@/components/view-header/drafts-toggle";
import type { MenuAnchor } from "@/components/view-header/filter-trigger-context";
import { ViewTabs } from "@/components/view-header/view-tabs";
import { ViewSwipe, type SwipeNeighbour } from "@/components/view-swipe";
import { errorMessage } from "@/github/api";
import { usePullRequests } from "@/github/hooks";
import {
  applySelectionAction,
  derivePrList,
  NO_SELECTION,
  toggleGroup,
  type PrList,
  type SelectionAction,
} from "@/lib/pr-list";
import { deriveStacks } from "@/lib/stacks";
import { useCollapsedGroups, useGroup, useHideDrafts, useLastPath } from "@/lib/storage";
import { useDesktop } from "@/lib/use-desktop";
import { useViews } from "@/lib/use-views";
import { cn } from "@/lib/utils";
import { countByView, type Views, type ViewsChange } from "@/lib/views";
import type { PullRequestList } from "@/types";

interface SearchProps {
  viewer: string;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenSearch: () => void;
}

interface OrgRouteProps extends SearchProps {
  owner: string;
  viewSlug: string | null;
}

export function OrgRoute({ owner, viewSlug, ...searchProps }: OrgRouteProps) {
  const state = useViews(owner, viewSlug);
  if (!state) return null;
  const { views, commit } = state;
  if (views.redirectTo) return <Redirect to={views.redirectTo} replace />;

  return <OrgPage owner={owner} views={views} commit={commit} {...searchProps} />;
}

interface OrgPageProps extends SearchProps {
  owner: string;
  views: Views;
  commit: (change: ViewsChange) => void;
}

function OrgPage({
  owner,
  views,
  commit,
  viewer,
  query,
  onQueryChange,
  onOpenSearch,
}: OrgPageProps) {
  const [location] = useLocation();
  const [, setLastPath] = useLastPath();
  const [group, setGroup] = useGroup();
  const [hideDraftsPreference, setHideDrafts] = useHideDrafts();
  const [collapsedGroups, setCollapsedGroups] = useCollapsedGroups(owner);
  const { filters, filtersChanged } = views;
  const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
  const changeFilterMenu = (anchor: MenuAnchor | null) =>
    setFilterMenu(anchor && { anchor, deferBar: anchor === "header" && !filtersChanged });
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [selection, setSelection] = useState(NO_SELECTION);
  const viewId = views.active?.id ?? null;
  const [shownViewId, setShownViewId] = useState(viewId);
  if (shownViewId !== viewId) {
    setShownViewId(viewId);
    setSelection(NO_SELECTION);
    setFilterMenu(null);
  }
  const desktop = useDesktop();
  const viewHeaderRef = useRef<HTMLDivElement>(null!);
  const { height: viewHeaderHeight = 0 } = useResizeObserver({
    ref: viewHeaderRef,
    box: "border-box",
  });
  const pullRequests = usePullRequests(owner);
  const deferredQuery = useDeferredValue(query);
  const [now, setNow] = useState(Date.now);
  useInterval(() => setNow(Date.now()), 60_000);

  const hideDrafts = desktop && hideDraftsPreference;
  const allPrs = pullRequests.data?.pullRequests ?? [];
  const stacks = useMemo(
    () => deriveStacks(pullRequests.data?.pullRequests ?? []),
    [pullRequests.data],
  );
  const orgPrs = hideDrafts ? allPrs.filter((pr) => !pr.isDraft) : allPrs;
  const listInput = {
    pullRequests: orgPrs,
    stacks,
    query: deferredQuery,
    viewer,
    group,
    collapsed: collapsedGroups,
    desktop,
  };
  const list = derivePrList({ ...listInput, filters, selection });
  const act = (action: SelectionAction) => setSelection(applySelectionAction(list, action));
  const select = useEventCallback((id: string) => act({ type: "select", id }));

  useEffect(() => setLastPath(location), [location, setLastPath]);

  const showAll = () => {
    commit(views.showAll());
    onQueryChange("");
  };

  const prTable = ({ groups, statusPending }: PrList, selectedId: string | null) =>
    statusPending ? (
      <LoadingRows />
    ) : (
      <PrTable
        groups={groups}
        group={group}
        compact={!!list.previewed}
        selectedId={selectedId}
        onSelect={select}
        now={now}
        query={deferredQuery}
        onShowAll={showAll}
        onClearSearch={() => onQueryChange("")}
        onToggleGroup={(key, all) => setCollapsedGroups(toggleGroup(list, key, all))}
      />
    );

  const viewIds = [null, ...views.list.map((view) => view.id)];
  const neighbour = (offset: 1 | -1): SwipeNeighbour | null => {
    if (desktop || allPrs.length === 0) return null;

    const id = viewIds[viewIds.indexOf(viewId) + offset];
    if (id === undefined) return null;

    const neighbourFilters = views.list.find((view) => view.id === id)?.filters ?? [];
    const neighbourList = derivePrList({
      ...listInput,
      filters: neighbourFilters,
      selection: NO_SELECTION,
    });
    return { href: views.hrefFor(id), content: prTable(neighbourList, null) };
  };

  const idle = !filterMenu && !displayMenuOpen;
  const hasRows = list.order.length > 0;
  const navigable = list.order.includes(selection.selectedId ?? "");
  const move = (delta: 1 | -1) => () => act({ type: "move", delta });
  const togglePreview = () => act({ type: "togglePreview" });
  useHotkeys(
    [
      { hotkey: "Mod+F", callback: onOpenSearch },
      {
        hotkey: "Escape",
        callback: ({ target }) => {
          if (target instanceof HTMLElement && target.matches("input, textarea, select"))
            target.blur();
          else act({ type: "escape" });
        },
        options: { preventDefault: false },
      },
      { hotkey: "/", callback: onOpenSearch, options: { enabled: idle } },
      { hotkey: "F", callback: () => changeFilterMenu("header"), options: { enabled: idle } },
      {
        hotkey: "D",
        callback: () => setHideDrafts(!hideDrafts),
        options: { enabled: idle && desktop },
      },
      { hotkey: "J", callback: move(1), options: { enabled: idle && hasRows } },
      { hotkey: "ArrowDown", callback: move(1), options: { enabled: idle && hasRows } },
      { hotkey: "K", callback: move(-1), options: { enabled: idle && hasRows } },
      { hotkey: "ArrowUp", callback: move(-1), options: { enabled: idle && hasRows } },
      { hotkey: "Enter", callback: togglePreview, options: { enabled: idle && navigable } },
      { hotkey: "Space", callback: togglePreview, options: { enabled: idle && navigable } },
      {
        hotkey: "O",
        callback: () => list.selected && window.open(list.selected.url, "_blank", "noopener"),
        options: { enabled: idle && !!list.selected, preventDefault: false },
      },
    ],
    { ignoreDefaultPrevented: true },
  );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col [--pinned-height:0px] max-md:[--pinned-height:calc(--spacing(12.5)+var(--view-header-height))]"
      style={{ "--view-header-height": `${viewHeaderHeight}px` } as CSSProperties}
    >
      <div className="max-md:h-(--view-header-height)">
        <div
          ref={viewHeaderRef}
          className="bg-background max-md:fixed max-md:inset-x-0 max-md:top-12.5 max-md:z-20"
        >
          <ViewHeader
            filters={filters}
            filtersChanged={filtersChanged}
            onFiltersChange={(next) => commit(views.setFilters(next))}
            onResetFilters={() => commit(views.resetFilters())}
            onSaveView={views.active ? () => commit(views.save()) : undefined}
            onSaveAsNewView={() => commit(views.saveAsNew())}
            filterMenu={filterMenu}
            onFilterMenuChange={changeFilterMenu}
            orgPrs={orgPrs}
            scopedPrs={list.scoped}
            viewer={viewer}
          >
            <ViewTabs
              views={views.list}
              viewCounts={pullRequests.data ? countByView(views.list, orgPrs, viewer) : {}}
              allOpenCount={pullRequests.data && orgPrs.length}
              activeViewId={views.active?.id ?? null}
              deletableViewId={views.deletableViewId}
              renamingViewId={views.session.renamingViewId}
              viewHref={views.hrefFor}
              onRenamingViewChange={(id) => commit(views.setRenaming(id))}
              onRenameView={(id, name) => commit(views.rename(id, name))}
              onDeleteView={(id) => commit(views.remove(id))}
            />
            <DraftsToggle hideDrafts={hideDrafts} onHideDraftsChange={setHideDrafts} />
            <FilterButton />
            <DisplayMenu
              open={displayMenuOpen}
              onOpenChange={setDisplayMenuOpen}
              group={group}
              onGroupChange={setGroup}
            />
          </ViewHeader>
        </div>
      </div>
      {pullRequests.data ? (
        <div
          className={cn(
            "flex flex-1 flex-col max-md:overflow-x-clip md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)] md:overflow-hidden",
            list.previewed && "md:grid-cols-[minmax(0,1fr)_minmax(380px,min(46%,800px))]",
          )}
        >
          <ViewSwipe
            previous={neighbour(-1)}
            next={neighbour(1)}
            topInset={() => viewHeaderRef.current.getBoundingClientRect().bottom}
            className="flex flex-1 flex-col pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] md:min-h-0 md:overflow-y-auto md:overscroll-contain"
          >
            {allPrs.length === 0 ? (
              <NoPullRequests owner={owner} result={pullRequests} />
            ) : (
              prTable(list, list.highlightedId)
            )}
            <TruncationNote list={pullRequests.data} />
          </ViewSwipe>
          {desktop ? (
            list.previewed && (
              <Preview
                pr={list.previewed}
                viewer={viewer}
                onClose={() => act({ type: "closePreview" })}
              />
            )
          ) : (
            <PreviewDrawer
              pr={list.selected}
              open={selection.previewOpen}
              viewer={viewer}
              onClose={() => act({ type: "closePreview" })}
            />
          )}
        </div>
      ) : pullRequests.isError ? (
        <LoadError result={pullRequests} />
      ) : (
        <LoadingRows />
      )}
    </div>
  );
}

function TruncationNote({ list }: { list: PullRequestList }) {
  if (list.totalCount <= list.pullRequests.length) return null;
  return (
    <div className="px-2 pt-3 md:px-4">
      <Alert variant="info">
        <InfoIcon />
        <AlertDescription>
          Showing the {list.pullRequests.length} most recently updated of {list.totalCount} open
          pull requests.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function NoPullRequests({
  owner,
  result,
}: {
  owner: string;
  result: UseQueryResult<PullRequestList>;
}) {
  return (
    <Empty>
      <EmptyHeader className="animate-rise motion-reduce:animate-none">
        <EmptyMedia variant="icon">
          <GitPullRequestIcon />
        </EmptyMedia>
        <EmptyTitle>No open pull requests</EmptyTitle>
        <EmptyDescription>{owner} is all clear.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          loading={result.isFetching}
          onClick={() => result.refetch()}
        >
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function LoadError({ result }: { result: UseQueryResult<PullRequestList> }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertIcon />
        </EmptyMedia>
        <EmptyTitle>Couldn't load pull requests</EmptyTitle>
        <EmptyDescription>{errorMessage(result.error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          loading={result.isFetching}
          onClick={() => result.refetch()}
        >
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function LoadingRows() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2" aria-busy="true">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex h-10 items-center gap-3 px-2 sm:h-9">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton
            className={cn("h-3", index % 3 === 0 ? "w-80" : index % 3 === 1 ? "w-64" : "w-96")}
          />
          <span className="grow" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
