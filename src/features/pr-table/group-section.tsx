import {
  ChevronRightIcon,
  StarFillIcon,
  StarIcon,
} from "@primer/octicons-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserAvatar } from "@/components/user-avatar";
import type { PrListGroup, ToggleScope } from "@/features/pr-table/lib/pr-list";
import { cn } from "@/lib/utils";
import type { Group, PullRequest } from "@/types";

import { usePrTable } from "./context";
import { ClusterRows } from "./rows";

const GROUP_HEADER =
  "flex h-9 items-center gap-2 rounded-md bg-muted px-2 text-start font-medium sm:h-8";

function toggleScope(event: Event) {
  if (!(event instanceof MouseEvent || event instanceof KeyboardEvent)) {
    return "group";
  }

  if (event.metaKey || event.ctrlKey) {
    return "others";
  }

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
  const pop = starred && reducedMotion !== true;

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`Star ${name}`}
      aria-pressed={starred}
      onClick={onToggle}
      className={cn(
        "absolute inset-y-0 inset-e-1 my-auto hover:bg-transparent",
        starred
          ? "text-yellow-500 dark:text-yellow-300"
          : "text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover/header:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-60"
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

function GroupHeading({
  group,
  name,
  rows,
}: {
  group: Group;
  name: string;
  rows: PullRequest[];
}) {
  return (
    <>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 in-data-panel-open:rotate-90 motion-reduce:transition-none sm:size-3.5" />
      {group === "author" && rows.length > 0 && (
        <UserAvatar login={name} avatarUrl={rows[0].authorAvatarUrl} />
      )}
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate">{name}</span>
        <span className="text-sm text-muted-foreground tabular-nums sm:text-xs">
          {rows.length}
        </span>
      </span>
    </>
  );
}

export function GroupSection({
  section: { key, rows, clusters, collapsed, starred },
  selectedId,
  onToggleGroup,
  onToggleStar,
}: {
  section: PrListGroup;
  selectedId: string | null;
  onToggleGroup: (key: string, scope: ToggleScope) => void;
  onToggleStar: (key: string) => void;
}) {
  const { group } = usePrTable();

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={(_, { event }) => {
        onToggleGroup(key, toggleScope(event));
      }}
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
          <div className="sticky top-[calc(var(--pinned-height,0px)+(--spacing(2)))] z-10 w-0">
            <div className="group/header relative w-[100cqw] bg-background shadow-[0_-8px_0_var(--background)]">
              <CollapsibleTrigger
                className={cn(
                  GROUP_HEADER,
                  "w-full pe-10 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <GroupHeading group={group} name={key} rows={rows} />
              </CollapsibleTrigger>
              <StarButton
                name={key}
                starred={starred}
                onToggle={() => {
                  onToggleStar(key);
                }}
              />
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
            />
          ))}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
