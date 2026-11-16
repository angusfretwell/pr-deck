import type { UseQueryResult } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { Redirect, useLocation } from "wouter";
import { Preview } from "@/components/Preview";
import { PrTable } from "@/components/PrTable";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewHeader, type FilterMenuState } from "@/components/ViewHeader";
import { errorMessage } from "@/github/api";
import { usePullRequests } from "@/github/hooks";
import { groupPullRequests, matchesText, passes, sameFilters } from "@/lib/filters";
import { useCollapsedGroups, useGroup, useLastPath, useStoredViews } from "@/lib/storage";
import {
  findViewBySlug,
  markDefaultViews,
  needsDefaultMarks,
  seedViews,
  slugify,
  uniqueName,
} from "@/lib/views";
import { cn } from "@/lib/utils";
import type { Filter, PullRequestList, View } from "@/types";

interface SearchProps {
  viewer: string;
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

interface OrgRouteProps extends SearchProps {
  owner: string;
  viewSlug: string | null;
}

const viewPath = (owner: string, viewName?: string) =>
  viewName === undefined ? `/${owner}` : `/${owner}/${slugify(viewName)}`;

export function OrgRoute({ owner, viewSlug, ...searchProps }: OrgRouteProps) {
  const [storedViews, setStoredViews] = useStoredViews();
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const views = storedViews[owner];

  useEffect(() => {
    if (!views) setStoredViews((prev) => (prev[owner] ? prev : { ...prev, [owner]: seedViews() }));
    else if (needsDefaultMarks(views))
      setStoredViews((prev) => ({ ...prev, [owner]: markDefaultViews(prev[owner] ?? []) }));
  }, [views, owner, setStoredViews]);

  if (!views) return null;
  const activeView = viewSlug === null ? null : findViewBySlug(views, viewSlug);
  if (activeView === undefined) return <Redirect to={viewPath(owner)} replace />;

  return (
    <OrgPage
      key={activeView?.id ?? ""}
      owner={owner}
      views={views}
      activeView={activeView}
      onViewsChange={(next) => setStoredViews((prev) => ({ ...prev, [owner]: next }))}
      renamingViewId={renamingViewId}
      onRenamingViewChange={setRenamingViewId}
      {...searchProps}
    />
  );
}

interface OrgPageProps extends SearchProps {
  owner: string;
  views: View[];
  activeView: View | null;
  onViewsChange: (views: View[]) => void;
  renamingViewId: string | null;
  onRenamingViewChange: (id: string | null) => void;
}

function OrgPage({
  owner,
  views,
  activeView,
  onViewsChange,
  renamingViewId,
  onRenamingViewChange,
  viewer,
  query,
  onQueryChange,
  searchRef,
}: OrgPageProps) {
  const [location, navigate] = useLocation();
  const [, setLastPath] = useLastPath();
  const [group, setGroup] = useGroup();
  const [collapsedGroups, setCollapsedGroups] = useCollapsedGroups();
  const savedFilters = activeView?.filters ?? [];
  const [filters, setFilters] = useState<Filter[]>(savedFilters);
  const filtersChanged = !sameFilters(filters, savedFilters);
  const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pullRequests = usePullRequests(owner);

  const orgPrs = pullRequests.data?.pullRequests ?? [];
  const scopedPrs = orgPrs.filter((pr) => matchesText(pr, query));
  const visible = scopedPrs.filter((pr) => passes(pr, filters, viewer));
  const groups = groupPullRequests(visible, group);
  const isCollapsed = (key: string) => collapsedGroups.includes(`${group}:${key}`);
  const toggleGroup = (key: string) => {
    const id = `${group}:${key}`;
    setCollapsedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const order = groups.flatMap(({ key, rows }) =>
    isCollapsed(key) ? [] : rows.map((pr) => pr.id),
  );
  const selected = visible.find((pr) => pr.id === selectedId);
  const previewed = drawerOpen ? selected : undefined;

  useEffect(() => setLastPath(location), [location, setLastPath]);

  const replaceView = (view: View) =>
    onViewsChange(views.map((existing) => (existing.id === view.id ? view : existing)));

  const saveAsNewView = () => {
    const view = { id: crypto.randomUUID(), name: uniqueName(views, "New view"), filters };
    onViewsChange([...views, view]);
    onRenamingViewChange(view.id);
    navigate(viewPath(owner, view.name));
  };

  const renameView = (id: string, requestedName: string) => {
    const name = uniqueName(views, requestedName, id);
    const view = views.find((existing) => existing.id === id);
    if (view) replaceView({ ...view, name });
    onRenamingViewChange(null);
    if (id === activeView?.id) navigate(viewPath(owner, name), { replace: true });
  };

  const deleteView = (id: string) => {
    onViewsChange(views.filter((view) => view.id !== id));
    navigate(viewPath(owner));
  };

  const showAll = () => {
    setFilters([]);
    onQueryChange("");
    navigate(viewPath(owner));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

      if (event.key === "Escape") {
        if (filterMenu) setFilterMenu(null);
        else if (displayMenuOpen) setDisplayMenuOpen(false);
        else if (typing) target.blur();
        else if (drawerOpen) setDrawerOpen(false);
        else setSelectedId(null);
        return;
      }
      if (typing || filterMenu || displayMenuOpen) return;

      const index = selectedId ? order.indexOf(selectedId) : -1;
      const move = (delta: number) => {
        if (!order.length) return;
        event.preventDefault();
        setSelectedId(
          order[Math.max(0, Math.min(order.length - 1, index < 0 ? 0 : index + delta))],
        );
      };

      if (event.key === "j" || event.key === "ArrowDown") move(1);
      else if (event.key === "k" || event.key === "ArrowUp") move(-1);
      else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        setFilterMenu({ anchor: "header", propertyKey: null, deferBar: !filtersChanged });
      } else if (event.key === "o" || event.key === "O") {
        if (selected) window.open(selected.url, "_blank", "noopener");
      } else if (
        (event.key === " " || event.key === "Enter") &&
        index >= 0 &&
        !target.closest("button, a, [role=button], [role=tab]")
      ) {
        event.preventDefault();
        setDrawerOpen(!drawerOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ViewHeader
        views={views}
        viewCounts={
          pullRequests.data
            ? Object.fromEntries(
                views.map((view) => [
                  view.id,
                  orgPrs.filter((pr) => passes(pr, view.filters, viewer)).length,
                ]),
              )
            : {}
        }
        allOpenCount={pullRequests.data?.pullRequests.length}
        activeViewId={activeView?.id ?? null}
        renamingViewId={renamingViewId}
        onSelectView={(id) => navigate(viewPath(owner, views.find((view) => view.id === id)?.name))}
        onRenamingViewChange={onRenamingViewChange}
        onRenameView={renameView}
        onDeleteView={deleteView}
        filters={filters}
        filtersChanged={filtersChanged}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters(savedFilters)}
        onSaveView={() => activeView && replaceView({ ...activeView, filters })}
        onSaveAsNewView={saveAsNewView}
        filterMenu={filterMenu}
        onFilterMenuChange={setFilterMenu}
        displayMenuOpen={displayMenuOpen}
        onDisplayMenuOpenChange={setDisplayMenuOpen}
        group={group}
        onGroupChange={setGroup}
        orgPrs={orgPrs}
        scopedPrs={scopedPrs}
        viewer={viewer}
      />
      {pullRequests.data ? (
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-hidden",
            previewed && "grid-cols-[minmax(0,1fr)_minmax(380px,46%)]",
          )}
        >
          <div className="min-h-0 overflow-y-auto pb-4">
            {orgPrs.length === 0 ? (
              <Empty>
                <EmptyDescription>No open pull requests in {owner}.</EmptyDescription>
              </Empty>
            ) : (
              <PrTable
                groups={groups}
                group={group}
                compact={!!previewed}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setDrawerOpen(true);
                }}
                onShowAll={showAll}
                isCollapsed={isCollapsed}
                onToggleGroup={toggleGroup}
              />
            )}
            <TruncationNote list={pullRequests.data} />
          </div>
          {previewed && (
            <Preview pr={previewed} viewer={viewer} onClose={() => setDrawerOpen(false)} />
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
    <p className="px-4 pt-3 text-muted-foreground text-xs">
      Showing the {list.pullRequests.length} most recently updated of {list.totalCount} open pull
      requests.
    </p>
  );
}

function LoadError({ result }: { result: UseQueryResult<PullRequestList> }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle className="text-base">Couldn't load pull requests</EmptyTitle>
        <EmptyDescription>{errorMessage(result.error)}</EmptyDescription>
      </EmptyHeader>
      <Button
        size="sm"
        variant="outline"
        loading={result.isFetching}
        onClick={() => result.refetch()}
      >
        Try again
      </Button>
    </Empty>
  );
}

function LoadingRows() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden px-2" aria-busy="true">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex h-9 items-center gap-3 px-2">
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
