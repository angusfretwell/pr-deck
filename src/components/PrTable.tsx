import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { BadgePill } from "@/components/status-badge";
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
  onShowAll: () => void;
  isCollapsed: (key: string) => boolean;
  onToggleGroup: (key: string) => void;
}

export function PrTable({
  groups,
  group,
  compact,
  selectedId,
  onSelect,
  onShowAll,
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
        <EmptyDescription>No pull requests match this view.</EmptyDescription>
        <EmptyContent>
          <Button variant="outline" onClick={onShowAll}>
            Show all open
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
            <Badge variant="secondary" className="me-1.5 text-muted-foreground">
              Draft
            </Badge>
          )}
          {pr.title}
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
          <span className="truncate text-muted-foreground">
            {pr.repo} <span className="text-muted-foreground/72">#{pr.number}</span>
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
      className="cursor-default px-2 pb-12 text-[13px]"
      style={{ "--columns": columns } as CSSProperties}
    >
      {groups.map(({ key, rows }) => {
        const collapsed = isCollapsed(key);
        return (
          <div key={key} role="group" aria-label={group === "none" ? undefined : key}>
            {group !== "none" && (
              <div className="sticky top-0 z-10 bg-background py-1">
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  onClick={() => onToggleGroup(key)}
                  className="flex h-9 w-full items-center gap-2 rounded-md bg-muted px-2 text-left font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            {!collapsed && rows.map(row)}
          </div>
        );
      })}
    </div>
  );
}
