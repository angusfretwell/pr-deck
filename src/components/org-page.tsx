import { AlertIcon, GitPullRequestIcon, InfoIcon } from "@primer/octicons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMediaQuery, useResizeObserver } from "usehooks-ts";
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
import { ViewHeader, type FilterMenuState, type MenuAnchor } from "@/components/view-header";
import { errorMessage } from "@/github/api";
import { usePullRequests } from "@/github/hooks";
import {
  applySelectionAction,
  derivePrList,
  keyCommand,
  NO_SELECTION,
  toggleGroup,
  type SelectionAction,
} from "@/lib/pr-list";
import { useCollapsedGroups, useGroup, useLastPath } from "@/lib/storage";
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

  return (
    <OrgPage
      key={views.active?.id ?? ""}
      owner={owner}
      views={views}
      commit={commit}
      {...searchProps}
    />
  );
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
  const [collapsedGroups, setCollapsedGroups] = useCollapsedGroups(owner);
  const { filters, filtersChanged } = views;
  const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
  const changeFilterMenu = (anchor: MenuAnchor | null) =>
    setFilterMenu(anchor && { anchor, deferBar: anchor === "header" && !filtersChanged });
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [selection, setSelection] = useState(NO_SELECTION);
  const desktop = useMediaQuery("(min-width: 768px)");
  const viewHeaderRef = useRef<HTMLDivElement>(null!);
  const { height: viewHeaderHeight = 0 } = useResizeObserver({
    ref: viewHeaderRef,
    box: "border-box",
  });
  const pullRequests = usePullRequests(owner);

  const orgPrs = pullRequests.data?.pullRequests ?? [];
  const list = derivePrList({
    pullRequests: orgPrs,
    query,
    filters,
    viewer,
    group,
    collapsed: collapsedGroups,
    selection,
    desktop,
  });
  const act = (action: SelectionAction) => setSelection(applySelectionAction(list, action));

  useEffect(() => setLastPath(location), [location, setLastPath]);

  const showAll = () => {
    commit(views.showAll());
    onQueryChange("");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      const command = keyCommand(list, {
        key: event.key,
        mod: event.metaKey || event.ctrlKey,
        alt: event.altKey,
        typing: /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName),
        menuOpen: !!filterMenu || displayMenuOpen,
        onControl:
          target instanceof Element && !!target.closest("button, a, [role=button], [role=tab]"),
      });
      if (!command) return;
      if (command.preventDefault) event.preventDefault();
      if (command.type === "selection") setSelection(command.selection);
      else if (command.type === "openSearch") onOpenSearch();
      else if (command.type === "openFilters") changeFilterMenu("header");
      else if (command.type === "openUrl") window.open(command.url, "_blank", "noopener");
      else target.blur();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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
            views={views.list}
            viewCounts={pullRequests.data ? countByView(views.list, orgPrs, viewer) : {}}
            allOpenCount={pullRequests.data?.pullRequests.length}
            activeViewId={views.active?.id ?? null}
            deletableViewId={views.deletableViewId}
            renamingViewId={views.session.renamingViewId}
            viewHref={views.hrefFor}
            onRenamingViewChange={(id) => commit(views.setRenaming(id))}
            onRenameView={(id, name) => commit(views.rename(id, name))}
            onDeleteView={(id) => commit(views.remove(id))}
            filters={filters}
            filtersChanged={filtersChanged}
            onFiltersChange={(next) => commit(views.setFilters(next))}
            onResetFilters={() => commit(views.resetFilters())}
            onSaveView={() => commit(views.save())}
            onSaveAsNewView={() => commit(views.saveAsNew())}
            filterMenu={filterMenu}
            onFilterMenuChange={changeFilterMenu}
            displayMenuOpen={displayMenuOpen}
            onDisplayMenuOpenChange={setDisplayMenuOpen}
            group={group}
            onGroupChange={setGroup}
            orgPrs={orgPrs}
            scopedPrs={list.scoped}
            viewer={viewer}
          />
        </div>
      </div>
      {pullRequests.data ? (
        <div
          className={cn(
            "flex flex-1 flex-col md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)] md:overflow-hidden",
            list.previewed && "md:grid-cols-[minmax(0,1fr)_minmax(380px,min(46%,800px))]",
          )}
        >
          <div className="flex flex-1 flex-col pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] md:min-h-0 md:overflow-y-auto md:overscroll-contain">
            {orgPrs.length === 0 ? (
              <NoPullRequests owner={owner} result={pullRequests} />
            ) : (
              <PrTable
                groups={list.groups}
                group={group}
                compact={!!list.previewed}
                selectedId={list.highlightedId}
                onSelect={(id) => act({ type: "select", id })}
                query={query}
                onShowAll={showAll}
                onClearSearch={() => onQueryChange("")}
                onToggleGroup={(key, all) => setCollapsedGroups(toggleGroup(list, key, all))}
              />
            )}
            <TruncationNote list={pullRequests.data} />
          </div>
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
