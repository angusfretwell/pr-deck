import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties, RefObject } from "react";
import { useMediaQuery } from "usehooks-ts";

import { PrTableContext, shownColumns } from "@/components/pr-table/context";
import { PrTableEmpty } from "@/components/pr-table/empty";
import { GroupSection } from "@/components/pr-table/group-section";
import type { PrListGroup, ToggleScope } from "@/lib/pr-list";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";

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

function useScrollSelectedIntoView(
  ref: RefObject<HTMLElement | null>,
  selectedId: string | null
) {
  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    ref.current
      ?.querySelector("[data-selected]")
      ?.scrollIntoView({ block: "nearest" });
  }, [ref, selectedId]);
}

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

  useScrollSelectedIntoView(ref, selectedId);

  const shown = useMemo(() => shownColumns(group, summary), [group, summary]);

  const context = useMemo(
    () => ({ shown, group, summary, now, onSelect }),
    [shown, group, summary, now, onSelect]
  );

  if (groups.every(({ rows }) => rows.length === 0)) {
    return (
      <PrTableEmpty
        query={query}
        onClearSearch={onClearSearch}
        onShowAll={onShowAll}
      />
    );
  }

  const columns = [
    "minmax(0, 1fr)",
    "auto",
    ...(shown.repo ? ["150px"] : []),
    ...(shown.author ? ["150px"] : []),
    ...(shown.face ? ["18px"] : []),
    summary ? "32px" : "52px",
  ].join(" ");

  const style: CSSProperties & { "--columns": string } = {
    "--columns": columns,
  };

  return (
    <PrTableContext value={context}>
      <div
        ref={ref}
        className={cn(
          "@container cursor-default px-2",
          group !== "none" && "pt-1"
        )}
        style={style}
      >
        {groups.map((section) => (
          <GroupSection
            key={section.key}
            section={section}
            selectedId={selectedId}
            onToggleGroup={onToggleGroup}
            onToggleStar={onToggleStar}
          />
        ))}
      </div>
    </PrTableContext>
  );
}
