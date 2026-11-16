import { XIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ALL_OPEN_NAME } from "@/lib/views";
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
  const scroller = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () =>
      setOverflow({
        start: element.scrollLeft > 1,
        end: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const countsKey = [allOpenCount, ...views.map((view) => viewCounts[view.id])].join();
  useEffect(() => {
    scroller.current
      ?.querySelector("[data-pressed]")
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeViewId, views.length, countsKey]);

  return (
    <Tabs
      className="relative -ms-2 min-w-0 md:-ms-4"
      value={activeViewId ?? ALL_OPEN_TAB}
      onValueChange={(value: string) => onSelectView(value === ALL_OPEN_TAB ? null : value)}
    >
      <div
        ref={scroller}
        className="-my-1 overflow-x-auto overflow-y-hidden py-1 ps-2 md:ps-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <TabsList className="justify-start gap-1.5 bg-transparent p-0 *:data-[slot=tab-indicator]:hidden">
          <TabPill active={activeViewId === null}>
            <ViewTab value={ALL_OPEN_TAB} name={ALL_OPEN_NAME} count={allOpenCount} />
          </TabPill>
          {views.map((view) => {
            const active = view.id === activeViewId;
            const count = viewCounts[view.id];
            if (view.id === renamingViewId) {
              return (
                <TabPill key={view.id} active={active}>
                  <span className="px-3 leading-5">
                    <RenameInput
                      name={view.name}
                      onCommit={(name) => onRenameView(view.id, name)}
                    />
                    <Count>{count}</Count>
                  </span>
                </TabPill>
              );
            }
            const deletable = active && !view.isDefault;
            return (
              <TabPill key={view.id} active={active}>
                <ViewTab
                  value={view.id}
                  name={view.name}
                  count={count}
                  className={cn(deletable && "pe-1.5")}
                  onDoubleClick={() => onRenamingViewChange(view.id)}
                />
                {deletable && (
                  <DeleteViewButton name={view.name} onConfirm={() => onDeleteView(view.id)} />
                )}
              </TabPill>
            );
          })}
        </TabsList>
      </div>
      <EdgeFade side="start" visible={overflow.start} />
      <EdgeFade side="end" visible={overflow.end} />
    </Tabs>
  );
}

function EdgeFade({ side, visible }: { side: "start" | "end"; visible: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 w-6 from-background to-transparent transition-opacity",
        side === "start" ? "start-0 bg-linear-to-r" : "end-0 bg-linear-to-l",
        !visible && "opacity-0",
      )}
    />
  );
}

function DeleteViewButton({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <Hint label="Delete view">
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="me-1 size-5 rounded-full text-muted-foreground before:rounded-full sm:size-5"
              aria-label="Delete view"
            />
          }
        >
          <XIcon className="size-3 sm:size-3" />
        </AlertDialogTrigger>
      </Hint>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This view and its filters will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" />} onClick={onConfirm}>
            Delete
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}

function TabPill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      data-pressed={active ? "" : undefined}
      className={cn(
        toggleVariants({ variant: "outline", size: "sm" }),
        "shrink-0 cursor-default gap-0 rounded-full px-0 before:rounded-full after:hidden",
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
        "h-full rounded-full border-0 px-3 text-inherit hover:text-inherit data-active:text-inherit sm:h-full",
        className,
      )}
      onDoubleClick={onDoubleClick}
    >
      <span className="flex max-w-50 items-center leading-5">
        <span className="truncate" title={name}>
          {name}
        </span>
        <Count>{count}</Count>
      </span>
    </TabsTab>
  );
}

function Count({ children }: { children: number | undefined }) {
  if (children === undefined) return null;
  return (
    <span className="ms-1.5 shrink-0 text-sm leading-none text-muted-foreground tabular-nums sm:text-xs">
      {children}
    </span>
  );
}

function RenameInput({ name, onCommit }: { name: string; onCommit: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  return (
    <input
      aria-label="View name"
      className="max-w-50 bg-transparent font-medium outline-none"
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
