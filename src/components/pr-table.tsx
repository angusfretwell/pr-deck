import {
  ChevronRightIcon,
  FilterRemoveIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  SearchIcon,
  StackCheckIcon,
  StackIcon,
  StarFillIcon,
  StarIcon,
} from "@primer/octicons-react";
import { motion, useReducedMotion } from "motion/react";
import { memo, useEffect, useRef, type CSSProperties } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BadgeIcon, BadgePill } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { age, isStale, issueBadges, statusBadge } from "@/lib/pr";
import type { PrListGroup, ToggleScope } from "@/lib/pr-list";
import type { Cluster, Stack } from "@/lib/stacks";
import { cn } from "@/lib/utils";
import type { Group, PullRequest } from "@/types";

export interface PrTableProps {
  groups: PrListGroup[];
  group: Group;
  compact: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
  query: string;
  onShowAll: () => void;
  onClearSearch: () => void;
  onToggleGroup: (key: string, scope: ToggleScope) => void;
  onToggleStar: (key: string) => void;
}

const shownColumns = (group: Group, summary: boolean) => ({
  repo: !summary && group !== "repo",
  author: !summary && group !== "author",
  face: summary && group !== "author",
});

export function PrTable({
  groups,
  group,
  compact,
  selectedId,
  onSelect,
  now,
  query,
  onShowAll,
  onClearSearch,
  onToggleGroup,
  onToggleStar,
}: PrTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const summary = useMediaQuery("(max-width: 639px)") || compact;
  useEffect(() => {
    ref.current?.querySelector("[data-selected]")?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (groups.every(({ rows }) => rows.length === 0)) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{query ? <SearchIcon /> : <FilterRemoveIcon />}</EmptyMedia>
          <EmptyTitle>
            {query ? `No results for "${query}"` : "Nothing matches this view"}
          </EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline" onClick={query ? onClearSearch : onShowAll}>
            {query ? "Clear search" : "Show all open"}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const shown = shownColumns(group, summary);
  const columns = [
    "minmax(0, 1fr)",
    "auto",
    ...(shown.repo ? ["150px"] : []),
    ...(shown.author ? ["150px"] : []),
    ...(shown.face ? ["18px"] : []),
    summary ? "32px" : "52px",
  ].join(" ");

  return (
    <div
      ref={ref}
      className={cn("@container cursor-default px-2", group !== "none" && "pt-1")}
      style={{ "--columns": columns } as CSSProperties}
    >
      {groups.map(({ key, rows, clusters, collapsed, starred }) => (
        <Collapsible
          key={key}
          open={!collapsed}
          onOpenChange={(_, { event }) => onToggleGroup(key, toggleScope(event))}
          className={cn(group !== "none" && "relative py-1")}
        >
          {group !== "none" && (
            <>
              <div
                aria-hidden
                data-panel-open={!collapsed || undefined}
                className={cn(GROUP_HEADER, "absolute inset-x-0 top-1")}
              >
                <GroupHeading group={group} name={key} rows={rows} />
              </div>
              <div className="sticky top-[calc(var(--pinned-height,0px)+--spacing(2))] z-10 w-0">
                <div className="group/header relative w-[100cqw] bg-background shadow-[0_-8px_0_var(--background)]">
                  <CollapsibleTrigger
                    className={cn(
                      GROUP_HEADER,
                      "w-full pe-10 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <GroupHeading group={group} name={key} rows={rows} />
                  </CollapsibleTrigger>
                  <StarButton name={key} starred={starred} onToggle={() => onToggleStar(key)} />
                </div>
              </div>
            </>
          )}
          <CollapsiblePanel>
            <div className="flex flex-col gap-0.5 pt-1">
              {clusters.map((cluster) => (
                <ClusterRows
                  key={cluster.stack?.id ?? cluster.rows[0]?.id}
                  cluster={cluster}
                  selectedId={selectedId}
                  group={group}
                  summary={summary}
                  now={now}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </CollapsiblePanel>
        </Collapsible>
      ))}
    </div>
  );
}

function toggleScope(event: Event): ToggleScope {
  if (!(event instanceof MouseEvent || event instanceof KeyboardEvent)) return "group";
  if (event.metaKey || event.ctrlKey) return "others";
  return event.altKey ? "all" : "group";
}

function StarButton({
  name,
  starred,
  onToggle,
}: {
  name: string;
  starred: boolean;
  onToggle: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const pop = starred && !reducedMotion;
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`Star ${name}`}
      aria-pressed={starred}
      onClick={onToggle}
      className={cn(
        "absolute inset-y-0 end-1 my-auto hover:bg-transparent",
        starred
          ? "text-yellow-500 dark:text-yellow-300"
          : "text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover/header:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-60",
      )}
    >
      <motion.span
        key={String(starred)}
        initial={pop ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.4 }}
        className="inline-flex"
      >
        {starred ? <StarFillIcon /> : <StarIcon />}
      </motion.span>
    </Button>
  );
}

const GROUP_HEADER =
  "flex h-9 items-center gap-2 rounded-md bg-muted px-2 text-start font-medium sm:h-8";

function GroupHeading({ group, name, rows }: { group: Group; name: string; rows: PullRequest[] }) {
  return (
    <>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 in-data-panel-open:rotate-90 motion-reduce:transition-none sm:size-3.5" />
      {group === "author" && rows[0] && (
        <UserAvatar login={name} avatarUrl={rows[0].authorAvatarUrl} />
      )}
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate">{name}</span>
        <span className="text-sm text-muted-foreground tabular-nums sm:text-xs">{rows.length}</span>
      </span>
    </>
  );
}

interface RowContext {
  group: Group;
  summary: boolean;
  now: number;
  onSelect: (id: string) => void;
}

interface ClusterRowsProps extends RowContext {
  cluster: Cluster;
  selectedId: string | null;
}

function ClusterRows({ cluster, selectedId, ...context }: ClusterRowsProps) {
  const { stack, rows } = cluster;
  const row = (pr: PullRequest, index: number) => (
    <PrRow
      key={pr.id}
      pr={pr}
      selected={pr.id === selectedId}
      stack={index === 0 ? stack : null}
      nested={index > 0}
      {...context}
    />
  );
  if (!stack) return rows.map(row);
  return (
    <div className="relative flex flex-col gap-0.5 [--row:--spacing(10)] sm:[--row:--spacing(9)]">
      {rows.map(row)}
      {rows.length > 1 && <StackTree nested={rows.length - 1} />}
    </div>
  );
}

const BRANCH = "absolute border-black/17 dark:border-white/18";
const ROOT_ICON_CLEARANCE = "15px";
const rowCentre = (index: number) => `calc(${index} * (var(--row) + 2px) + var(--row) / 2)`;

function StackTree({ nested }: { nested: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className={cn(BRANCH, "left-[14px] w-3 rounded-bl-[3px] border-b border-l")}
        style={{
          top: `calc(var(--row) / 2 + ${ROOT_ICON_CLEARANCE})`,
          height: `calc(${nested} * (var(--row) + 2px) - ${ROOT_ICON_CLEARANCE} + 1px)`,
        }}
      />
      {Array.from({ length: nested - 1 }, (_, index) => (
        <span
          key={index}
          className={cn(BRANCH, "left-[15px] w-[11px] border-t")}
          style={{ top: rowCentre(index + 1) }}
        />
      ))}
    </span>
  );
}

function StackBadge({ stack }: { stack: Stack }) {
  const ready = stack.layers.every((layer) => statusBadge(layer).tone === "ok");
  const Glyph = ready ? StackCheckIcon : StackIcon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "ms-1 bg-transparent font-[450] tabular-nums dark:bg-transparent",
        ready ? "border-success/40 text-success-foreground" : "text-muted-foreground",
      )}
    >
      <Glyph aria-label={ready ? "Stack, ready to merge" : "Stack"} />
      {stack.layers.length}
    </Badge>
  );
}

interface PrRowProps extends RowContext {
  pr: PullRequest;
  selected: boolean;
  stack: Stack | null;
  nested: boolean;
}

const PrRow = memo(function PrRow({
  pr,
  selected,
  stack,
  nested,
  group,
  summary,
  now,
  onSelect,
}: PrRowProps) {
  const shown = shownColumns(group, summary);
  return (
    <div
      data-selected={selected || undefined}
      onClick={(event) =>
        event.metaKey || event.ctrlKey ? window.open(pr.url, "_blank", "noopener") : onSelect(pr.id)
      }
      className={cn(
        "grid h-10 touch-manipulation grid-cols-(--columns) items-center gap-x-2.5 rounded-md px-2 sm:h-9",
        group === "none"
          ? "scroll-mt-(--pinned-height)"
          : "scroll-mt-[calc(var(--pinned-height,0px)+--spacing(12))] sm:scroll-mt-[calc(var(--pinned-height,0px)+--spacing(11))]",
        selected ? "bg-info-muted" : "hover:bg-accent active:bg-accent",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 font-[450]">
        {nested && <span className="w-5 shrink-0" />}
        {pr.isDraft ? (
          <GitPullRequestDraftIcon
            aria-label="Draft"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        ) : (
          <GitPullRequestIcon aria-hidden className="size-3.5 shrink-0 text-success-foreground" />
        )}
        <a
          href={pr.url}
          aria-current={selected || undefined}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) event.stopPropagation();
            else event.preventDefault();
          }}
          className="truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <bdi>{pr.title}</bdi>
        </a>
        {!shown.repo && (
          <span className="ms-0.5 shrink-0 font-normal text-muted-foreground/72 max-sm:text-sm">
            #{pr.number}
          </span>
        )}
        {stack && <StackBadge stack={stack} />}
      </span>
      {pr.statusPending ? (
        <span className="inline-flex h-5 items-center justify-end">
          <Skeleton className={summary ? "mx-0.75 size-3.5 rounded-full" : "h-3 w-12"} />
        </span>
      ) : summary ? (
        <BadgeIcon badge={statusBadge(pr)} className="size-3.5" />
      ) : (
        <span className="flex min-w-0 items-center justify-end gap-1 overflow-hidden">
          {issueBadges(pr).map((badge) => (
            <BadgePill key={badge.label} badge={badge} />
          ))}
        </span>
      )}
      {shown.repo && (
        <span
          title={`${pr.repo} #${pr.number}`}
          className="flex min-w-0 gap-1 text-muted-foreground"
        >
          <span className="truncate">{pr.repo}</span>
          <span className="shrink-0 text-muted-foreground/72">#{pr.number}</span>
        </span>
      )}
      {shown.author && (
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
          <span className="truncate">{pr.author}</span>
        </span>
      )}
      {shown.face && <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />}
      <span
        className={cn(
          "text-end tabular-nums max-sm:text-sm",
          isStale(pr.updatedAt, now) ? "text-warning-foreground" : "text-muted-foreground",
        )}
      >
        {age(pr.updatedAt, now)}
      </span>
    </div>
  );
});
