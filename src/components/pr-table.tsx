import { GitPullRequestDraftIcon } from "@primer/octicons-react";
import { ChevronRightIcon, FunnelXIcon, SearchXIcon } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { useMediaQuery } from "usehooks-ts";
import { BadgeIcon, BadgePill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { UserAvatar } from "@/components/user-avatar";
import { age, isStale, issueBadges, statusBadge } from "@/lib/pr";
import type { PrListGroup } from "@/lib/pr-list";
import { cn } from "@/lib/utils";
import type { Group, PullRequest } from "@/types";

export interface PrTableProps {
  groups: PrListGroup[];
  group: Group;
  compact: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onShowAll: () => void;
  onClearSearch: () => void;
  onToggleGroup: (key: string, all: boolean) => void;
}

export function PrTable({
  groups,
  group,
  compact,
  selectedId,
  onSelect,
  query,
  onShowAll,
  onClearSearch,
  onToggleGroup,
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
          <EmptyMedia variant="icon">{query ? <SearchXIcon /> : <FunnelXIcon />}</EmptyMedia>
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

  const showRepo = !summary && group !== "repo";
  const showAuthor = !summary && group !== "author";
  const showFace = summary && group !== "author";
  const columns = [
    "minmax(0, 1fr)",
    "auto",
    ...(showRepo ? ["150px"] : []),
    ...(showAuthor ? ["150px"] : []),
    ...(showFace ? ["18px"] : []),
    summary ? "40px" : "52px",
  ].join(" ");

  const row = (pr: PullRequest) => {
    const selected = pr.id === selectedId;
    return (
      <div
        key={pr.id}
        data-selected={selected || undefined}
        onClick={(event) =>
          event.metaKey || event.ctrlKey
            ? window.open(pr.url, "_blank", "noopener")
            : onSelect(pr.id)
        }
        className={cn(
          "grid h-10 touch-manipulation grid-cols-(--columns) items-center gap-x-2.5 rounded-md px-2 sm:h-9",
          group === "none"
            ? "scroll-mt-(--pinned-height)"
            : "scroll-mt-[calc(var(--pinned-height,0px)+--spacing(12))] sm:scroll-mt-[calc(var(--pinned-height,0px)+--spacing(11))]",
          selected ? "bg-info/8 dark:bg-info/16" : "hover:bg-accent active:bg-accent",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          {pr.isDraft && (
            <GitPullRequestDraftIcon
              aria-label="Draft"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
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
          {!summary && !showRepo && (
            <span className="ms-0.5 shrink-0 font-normal text-muted-foreground/72">
              {group === "repo" ? "" : `${pr.repo} `}#{pr.number}
            </span>
          )}
        </span>
        {summary ? (
          <BadgeIcon badge={statusBadge(pr)} className="size-3.5" />
        ) : (
          <span className="flex min-w-0 items-center justify-end gap-1 overflow-hidden">
            {issueBadges(pr).map((badge) => (
              <BadgePill key={badge.label} badge={badge} />
            ))}
          </span>
        )}
        {showRepo && (
          <span
            title={`${pr.repo} #${pr.number}`}
            className="flex min-w-0 gap-1 text-muted-foreground"
          >
            <span className="truncate">{pr.repo}</span>
            <span className="shrink-0 text-muted-foreground/72">#{pr.number}</span>
          </span>
        )}
        {showAuthor && (
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
            <span className="truncate">{pr.author}</span>
          </span>
        )}
        {showFace && <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />}
        <span
          className={cn(
            "text-end tabular-nums",
            isStale(pr.updatedAt) ? "text-warning-foreground" : "text-muted-foreground",
          )}
        >
          {age(pr.updatedAt)}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={cn("@container cursor-default px-2", group !== "none" && "pt-1")}
      style={{ "--columns": columns } as CSSProperties}
    >
      {groups.map(({ key, rows, collapsed }) => (
        <Collapsible
          key={key}
          open={!collapsed}
          onOpenChange={(_, { event }) => onToggleGroup(key, "altKey" in event && event.altKey)}
          className="data-closed:pb-1"
        >
          {group !== "none" && (
            <div className="sticky top-[calc(var(--pinned-height,0px)+--spacing(2))] z-10 mt-1 w-0">
              <div className="w-[100cqw] bg-background shadow-[0_-8px_0_var(--background)]">
                <CollapsibleTrigger className="flex h-9 w-full items-center gap-2 rounded-md bg-muted px-2 text-start font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8">
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 in-data-panel-open:rotate-90 motion-reduce:transition-none sm:size-3.5" />
                  {group === "author" && rows[0] && (
                    <UserAvatar login={key} avatarUrl={rows[0].authorAvatarUrl} />
                  )}
                  <span className="truncate">{key}</span>
                  <span className="text-muted-foreground/72 tabular-nums">{rows.length}</span>
                </CollapsibleTrigger>
              </div>
            </div>
          )}
          <CollapsiblePanel>
            <div className="flex flex-col gap-0.5 pt-1">{rows.map(row)}</div>
          </CollapsiblePanel>
        </Collapsible>
      ))}
    </div>
  );
}
