import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { BadgePill, pillClassName } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription } from "@/components/ui/empty";
import { UserAvatar } from "@/components/user-avatar";
import type { PullRequestGroup } from "@/lib/filters";
import { age, isStale, issueBadges } from "@/lib/pr";
import { cn } from "@/lib/utils";
import type { Group, PullRequest } from "@/types";

export interface PrTableProps {
  groups: PullRequestGroup[];
  group: Group;
  compact: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onShowAll: () => void;
  onClearSearch: () => void;
  isCollapsed: (key: string) => boolean;
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
  isCollapsed,
  onToggleGroup,
}: PrTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (groups.every(({ rows }) => rows.length === 0)) {
    return (
      <Empty>
        <EmptyDescription>
          {query ? `No pull requests match "${query}".` : "No pull requests match this view."}
        </EmptyDescription>
        <EmptyContent>
          <Button variant="outline" onClick={query ? onClearSearch : onShowAll}>
            {query ? "Clear search" : "Show all open"}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const showRepo = !compact && group !== "repo";
  const showAuthor = !compact && group !== "author";
  const showFace = compact && group !== "author";
  const columns = [
    "minmax(0, 1fr)",
    "auto",
    ...(showRepo ? ["150px"] : []),
    ...(showAuthor ? ["150px"] : []),
    ...(showFace ? ["18px"] : []),
    "52px",
  ].join(" ");

  const row = (pr: PullRequest) => {
    const selected = pr.id === selectedId;
    return (
      <div
        key={pr.id}
        role="option"
        aria-selected={selected}
        onClick={(event) =>
          event.metaKey || event.ctrlKey
            ? window.open(pr.url, "_blank", "noopener")
            : onSelect(pr.id)
        }
        className={cn(
          "grid h-9 grid-cols-(--columns) items-center gap-x-2.5 rounded-md px-2",
          group !== "none" && "scroll-mt-11",
          selected ? "bg-info/8 dark:bg-info/16" : "hover:bg-accent",
        )}
      >
        <span className="truncate font-medium">
          {pr.isDraft && (
            <Badge variant="secondary" className={cn(pillClassName, "me-1.5")}>
              Draft
            </Badge>
          )}
          <bdi>{pr.title}</bdi>
          {!showRepo && (
            <span className="ms-2 font-normal text-muted-foreground/72">
              {group === "repo" ? "" : `${pr.repo} `}#{pr.number}
            </span>
          )}
        </span>
        <span className="flex min-w-0 items-center justify-end gap-1 overflow-hidden">
          {issueBadges(pr).map((badge) => (
            <BadgePill key={badge.label} badge={badge} />
          ))}
        </span>
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
            "text-right tabular-nums",
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
      role="listbox"
      aria-label="Pull requests"
      className={cn("cursor-default px-2 text-[13px]", group !== "none" && "pt-1")}
      style={{ "--columns": columns } as CSSProperties}
    >
      {groups.map(({ key, rows }) => {
        const collapsed = isCollapsed(key);
        return (
          <div
            key={key}
            role="group"
            aria-label={group === "none" ? undefined : key}
            className={cn(collapsed && "pb-1")}
          >
            {group !== "none" && (
              <div className="sticky top-1 z-10 mt-1 bg-background shadow-[0_-4px_0_var(--background)]">
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  onClick={(event) => onToggleGroup(key, event.altKey)}
                  className="flex h-8 w-full items-center gap-2 rounded-md bg-muted px-2 text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRightIcon
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
                      !collapsed && "rotate-90",
                    )}
                  />
                  {group === "author" && rows[0] && (
                    <UserAvatar login={key} avatarUrl={rows[0].authorAvatarUrl} />
                  )}
                  <span className="truncate">{key}</span>
                  <span className="font-medium text-muted-foreground/72 tabular-nums">
                    {rows.length}
                  </span>
                </button>
              </div>
            )}
            {!collapsed && <div className="flex flex-col gap-0.5 pt-1">{rows.map(row)}</div>}
          </div>
        );
      })}
    </div>
  );
}
