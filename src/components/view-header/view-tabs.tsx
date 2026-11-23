import { XIcon } from "@primer/octicons-react";
import { animate, motion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDesktop } from "@/lib/use-desktop";
import { cn } from "@/lib/utils";
import { ALL_OPEN_NAME } from "@/lib/views";
import type { View } from "@/types";
import { Hint } from "./hint";

interface ViewTabsProps {
  views: View[];
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  activeViewId: string | null;
  deletableViewId: string | null;
  renamingViewId: string | null;
  viewHref: (id: string | null) => string;
  onRenamingViewChange: (id: string | null) => void;
  onRenameView: (id: string, name: string) => void;
  onDeleteView: (id: string) => void;
}

const PILL = "rounded-full before:rounded-full";

export function ViewTabs({
  views,
  viewCounts,
  allOpenCount,
  activeViewId,
  deletableViewId,
  renamingViewId,
  viewHref,
  onRenamingViewChange,
  onRenameView,
  onDeleteView,
}: ViewTabsProps) {
  const nav = useRef<HTMLElement>(null);
  const desktop = useDesktop();
  const glide = useRef<AnimationPlaybackControls>(null);
  const panned = useRef(false);
  const viewport = () => nav.current!.closest("[data-slot=scroll-area-viewport]")!;
  const scrolledViewId = useRef(activeViewId);

  const centerActive = (glide: boolean) => {
    const strip = nav.current;
    const viewport = strip?.closest("[data-slot=scroll-area-viewport]");
    if (!strip || !viewport) return;
    const from = viewport.scrollLeft - (parseFloat(getComputedStyle(strip).translate) || 0);
    strip
      .querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
    const shift = viewport.scrollLeft - from;
    if (!glide || !shift) return;
    strip.style.transition = "none";
    strip.style.translate = `${shift}px`;
    strip.getBoundingClientRect();
    strip.style.transition = "";
    strip.style.translate = "";
  };

  const countsKey = [allOpenCount, ...views.map((view) => viewCounts[view.id])].join();
  useEffect(() => {
    const switched = scrolledViewId.current !== activeViewId;
    scrolledViewId.current = activeViewId;
    centerActive(switched);
  }, [activeViewId, views.length, countsKey]);

  return (
    <ScrollArea
      scrollFade
      className="-my-2 -ms-2 min-w-0 *:data-[slot=scroll-area-scrollbar]:hidden max-md:*:data-[slot=scroll-area-viewport]:overflow-hidden! md:-ms-4"
    >
      <motion.nav
        ref={nav}
        aria-label="Views"
        className="flex w-max gap-1.5 py-2 ps-2 transition-[translate] duration-300 ease-snappy motion-reduce:transition-none max-md:touch-pan-y md:ps-4"
        onPointerDownCapture={() => {
          panned.current = false;
          glide.current?.stop();
        }}
        onPanStart={() => (panned.current = !desktop)}
        onPan={(_, { delta }) => {
          if (panned.current) viewport().scrollLeft -= delta.x;
        }}
        onPanEnd={(_, { velocity }) => {
          if (!panned.current) return;
          const strip = viewport();
          glide.current = animate(strip.scrollLeft, strip.scrollLeft, {
            type: "inertia",
            velocity: -velocity.x,
            min: 0,
            max: strip.scrollWidth - strip.clientWidth,
            onUpdate: (left) => (strip.scrollLeft = left),
          });
        }}
        onClickCapture={(event) => {
          if (panned.current) event.stopPropagation();
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName === "grid-template-columns") centerActive(true);
        }}
      >
        <ViewLink
          href={viewHref(null)}
          active={activeViewId === null}
          name={ALL_OPEN_NAME}
          count={allOpenCount}
        />
        {views.map((view) => {
          const active = view.id === activeViewId;
          const count = viewCounts[view.id];
          if (view.id === renamingViewId) {
            return (
              <RenameInput
                key={view.id}
                name={view.name}
                count={count}
                onCommit={(name) => onRenameView(view.id, name)}
              />
            );
          }
          const deletable = view.id === deletableViewId;
          return (
            <div key={view.id} className="relative flex">
              <ViewLink
                href={viewHref(view.id)}
                active={active}
                name={view.name}
                count={count}
                className={cn(deletable && "pe-9 sm:pe-8")}
                onDoubleClick={() => onRenamingViewChange(view.id)}
              />
              {deletable && (
                <DeleteViewButton name={view.name} onConfirm={() => onDeleteView(view.id)} />
              )}
            </div>
          );
        })}
      </motion.nav>
    </ScrollArea>
  );
}

interface ViewLinkProps {
  href: string;
  active: boolean;
  name: string;
  count: number | undefined;
  className?: string;
  onDoubleClick?: () => void;
}

function ViewLink({ href, active, name, count, className, onDoubleClick }: ViewLinkProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        PILL,
        "aria-[current=page]:bg-input/64 aria-[current=page]:shadow-none dark:aria-[current=page]:bg-input",
        className,
      )}
      render={<Link href={href} aria-current={active ? "page" : undefined} />}
      onDoubleClick={onDoubleClick}
    >
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="max-w-50 truncate" title={name}>
          {name}
        </span>
        <Count>{count}</Count>
      </span>
    </Button>
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
              className={cn(PILL, "absolute end-1 top-1/2 -translate-y-1/2")}
              aria-label="Delete view"
            />
          }
        >
          <XIcon />
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

function Count({ children }: { children: number | undefined }) {
  const [loadedOnMount] = useState(children !== undefined);
  if (children === undefined) return null;
  return (
    <span
      className={cn(
        "-ms-1.5 grid grid-cols-[1fr] text-sm leading-none text-muted-foreground tabular-nums sm:text-xs",
        !loadedOnMount &&
          "transition-[grid-template-columns,opacity] ease-snappy [transition-delay:0ms,100ms] [transition-duration:150ms,100ms] starting:grid-cols-[0fr] starting:opacity-0 motion-reduce:transition-opacity",
      )}
    >
      <span className="min-w-0 overflow-hidden ps-1.5">{children}</span>
    </span>
  );
}

interface RenameInputProps {
  name: string;
  count: number | undefined;
  onCommit: (name: string) => void;
}

function RenameInput({ name, count, onCommit }: RenameInputProps) {
  const [draft, setDraft] = useState(name);
  return (
    <InputGroup className={cn(PILL, "h-8 w-auto sm:h-7")}>
      <InputGroupInput
        size="sm"
        aria-label="View name"
        className="font-medium"
        style={{ width: `min(${Math.max(draft.length, 4) + 1}ch, 12.5rem)` }}
        value={draft}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      />
      {count !== undefined && (
        <InputGroupAddon align="inline-end">
          <Count>{count}</Count>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
