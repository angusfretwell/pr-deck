import {
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  StackCheckIcon,
  StackIcon,
} from "@primer/octicons-react";
import { memo } from "react";

import { usePrTable } from "@/components/pr-table/context";
import { BadgeIcon, BadgePill } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { age, isStale, issueBadges, statusBadge } from "@/lib/pr";
import type { Cluster, Stack } from "@/lib/stacks";
import { cn } from "@/lib/utils";
import type { PullRequest } from "@/types";

const BRANCH = "absolute border-black/17 dark:border-white/18";
const ROOT_ICON_CLEARANCE = "15px";

function rowCentre(index: number) {
  return `calc(${index} * (var(--row) + 2px) + var(--row) / 2)`;
}

function StackTree({ nested }: { nested: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className={cn(
          BRANCH,
          "left-[14px] w-3 rounded-bl-[3px] border-b border-l"
        )}
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
        ready
          ? "border-success/40 text-success-foreground"
          : "text-muted-foreground"
      )}
    >
      <Glyph aria-label={ready ? "Stack, ready to merge" : "Stack"} />
      {stack.layers.length}
    </Badge>
  );
}

function StatusCell({ pr, summary }: { pr: PullRequest; summary: boolean }) {
  if (pr.statusPending) {
    return (
      <span className="inline-flex h-5 items-center justify-end">
        <Skeleton
          className={summary ? "mx-0.75 size-3.5 rounded-full" : "h-3 w-12"}
        />
      </span>
    );
  }

  if (summary) {
    return <BadgeIcon badge={statusBadge(pr)} className="size-3.5" />;
  }

  return (
    <span className="flex min-w-0 items-center justify-end gap-1 overflow-hidden">
      {issueBadges(pr).map((badge) => (
        <BadgePill key={badge.label} badge={badge} />
      ))}
    </span>
  );
}

function PrTitleCell({
  pr,
  selected,
  stack,
  nested,
}: {
  pr: PullRequest;
  selected: boolean;
  stack: Stack | null;
  nested: boolean;
}) {
  const { shown } = usePrTable();

  return (
    <span className="flex min-w-0 items-center gap-1.5 font-[450]">
      {nested && <span className="w-5 shrink-0" />}
      {pr.isDraft ? (
        <GitPullRequestDraftIcon
          aria-label="Draft"
          className="text-muted-foreground size-3.5 shrink-0"
        />
      ) : (
        <GitPullRequestIcon
          aria-hidden
          className="text-success-foreground size-3.5 shrink-0"
        />
      )}
      <a
        href={pr.url}
        aria-current={selected || undefined}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) {
            event.stopPropagation();
          } else {
            event.preventDefault();
          }
        }}
        className="focus-visible:ring-ring truncate rounded-sm outline-none focus-visible:ring-2"
      >
        <bdi>{pr.title}</bdi>
      </a>
      {!shown.repo && (
        <span className="text-muted-foreground/72 ms-0.5 shrink-0 font-normal max-sm:text-sm">
          #{pr.number}
        </span>
      )}
      {stack && <StackBadge stack={stack} />}
    </span>
  );
}

interface PrRowProps {
  pr: PullRequest;
  selected: boolean;
  stack: Stack | null;
  nested: boolean;
}

const PrRow = memo(({ pr, selected, stack, nested }: PrRowProps) => {
  const { shown, group, summary, now, onSelect } = usePrTable();

  return (
    <div
      role="presentation"
      data-selected={selected || undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          window.open(pr.url, "_blank", "noopener");
        } else {
          onSelect(pr.id);
        }
      }}
      className={cn(
        "grid h-10 touch-manipulation grid-cols-(--columns) items-center gap-x-2.5 rounded-md px-2 sm:h-9",
        group === "none"
          ? "scroll-mt-(--pinned-height)"
          : "scroll-mt-[calc(var(--pinned-height,0px)+--spacing(12))] sm:scroll-mt-[calc(var(--pinned-height,0px)+--spacing(11))]",
        selected ? "bg-info-muted" : "hover:bg-accent active:bg-accent"
      )}
    >
      <PrTitleCell pr={pr} selected={selected} stack={stack} nested={nested} />
      <StatusCell pr={pr} summary={summary} />
      {shown.repo && (
        <span
          title={`${pr.repo} #${pr.number}`}
          className="text-muted-foreground flex min-w-0 gap-1"
        >
          <span className="truncate">{pr.repo}</span>
          <span className="text-muted-foreground/72 shrink-0">
            #{pr.number}
          </span>
        </span>
      )}
      {shown.author && (
        <span className="text-muted-foreground flex min-w-0 items-center gap-1.5">
          <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
          <span className="truncate">{pr.author}</span>
        </span>
      )}
      {shown.face && (
        <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
      )}
      <span
        className={cn(
          "text-end tabular-nums max-sm:text-sm",
          isStale(pr.updatedAt, now)
            ? "text-warning-foreground"
            : "text-muted-foreground"
        )}
      >
        {age(pr.updatedAt, now)}
      </span>
    </div>
  );
});

PrRow.displayName = "PrRow";

export function ClusterRows({
  cluster,
  selectedId,
}: {
  cluster: Cluster;
  selectedId: string | null;
}) {
  const { stack, rows } = cluster;

  function row(pr: PullRequest, index: number) {
    return (
      <PrRow
        key={pr.id}
        pr={pr}
        selected={pr.id === selectedId}
        stack={index === 0 ? stack : null}
        nested={index > 0}
      />
    );
  }

  if (!stack) {
    return rows.map(row);
  }

  return (
    <div className="relative flex flex-col gap-0.5 [--row:--spacing(10)] sm:[--row:--spacing(9)]">
      {rows.map(row)}
      {rows.length > 1 && <StackTree nested={rows.length - 1} />}
    </div>
  );
}
