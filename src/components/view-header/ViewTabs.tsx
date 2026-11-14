import { XIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { View } from "@/types";
import { Hint } from "./Hint";

const ALL_OPEN_TAB = "all-open";

interface ViewTabsProps {
  views: View[];
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  activeViewId: string | null;
  renamingViewId: string | null;
  onSelectView: (id: string | null) => void;
  onRenamingViewChange: (id: string | null) => void;
  onRenameView: (id: string, name: string) => void;
  onDeleteView: (id: string) => void;
}

export function ViewTabs({
  views,
  viewCounts,
  allOpenCount,
  activeViewId,
  renamingViewId,
  onSelectView,
  onRenamingViewChange,
  onRenameView,
  onDeleteView,
}: ViewTabsProps) {
  return (
    <Tabs
      value={activeViewId ?? ALL_OPEN_TAB}
      onValueChange={(value: string) => onSelectView(value === ALL_OPEN_TAB ? null : value)}
    >
      <TabsList className="flex-wrap justify-start gap-1.5 bg-transparent p-0 *:data-[slot=tab-indicator]:hidden">
        <TabPill active={activeViewId === null}>
          <ViewTab value={ALL_OPEN_TAB} name="All open" count={allOpenCount} />
        </TabPill>
        {views.map((view) => {
          const active = view.id === activeViewId;
          const count = viewCounts[view.id];
          if (view.id === renamingViewId) {
            return (
              <TabPill key={view.id} active={active}>
                <RenameInput name={view.name} onCommit={(name) => onRenameView(view.id, name)} />
                <Count className="pe-3">{count}</Count>
              </TabPill>
            );
          }
          return (
            <TabPill key={view.id} active={active}>
              <ViewTab
                value={view.id}
                name={view.name}
                count={count}
                className={cn(active && "pe-1.5")}
                onDoubleClick={() => onRenamingViewChange(view.id)}
              />
              {active && (
                <Hint label="Delete view">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="me-1 size-5 text-muted-foreground sm:size-5"
                    aria-label="Delete view"
                    onClick={() => onDeleteView(view.id)}
                  >
                    <XIcon className="size-3 sm:size-3" />
                  </Button>
                </Hint>
              )}
            </TabPill>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function TabPill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-7 items-center rounded-full border bg-background text-muted-foreground",
        active && "border-transparent bg-muted text-foreground",
      )}
    >
      {children}
    </div>
  );
}

interface ViewTabProps {
  value: string;
  name: string;
  count: number | undefined;
  className?: string;
  onDoubleClick?: () => void;
}

function ViewTab({ value, name, count, className, onDoubleClick }: ViewTabProps) {
  return (
    <TabsTab
      value={value}
      className={cn(
        "h-full rounded-full border-0 px-3 text-[13px] text-inherit hover:text-foreground sm:h-full sm:text-[13px]",
        className,
      )}
      onDoubleClick={onDoubleClick}
    >
      {name}
      <Count>{count}</Count>
    </TabsTab>
  );
}

function Count({ className, children }: { className?: string; children: number | undefined }) {
  if (children === undefined) return null;
  return (
    <span className={cn("text-[11px] text-muted-foreground tabular-nums", className)}>
      {children}
    </span>
  );
}

function RenameInput({ name, onCommit }: { name: string; onCommit: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  return (
    <input
      aria-label="View name"
      className="me-1.5 ms-3 bg-transparent font-medium outline-none"
      style={{ width: `${Math.max(draft.length, 4) + 1}ch` }}
      value={draft}
      autoFocus
      autoComplete="off"
      spellCheck={false}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
    />
  );
}
