import { XIcon } from "@primer/octicons-react";
import { motion } from "motion/react";
import { useReducer, useRef, useState } from "react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCenterActive } from "@/features/views/hooks/use-center-active";
import { usePanScroll } from "@/features/views/hooks/use-pan-scroll";
import { ALL_OPEN_NAME } from "@/features/views/lib/views";
import { cn } from "@/lib/utils";
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

function Count({ children }: { children: number | undefined }) {
  const [loadedOnMount] = useReducer(
    (state: boolean) => state,
    children !== undefined
  );

  if (children === undefined) {
    return null;
  }

  return (
    <span
      className={cn(
        "text-muted-foreground -ms-1.5 grid grid-cols-[1fr] text-sm leading-none tabular-nums sm:text-xs",
        !loadedOnMount &&
          "ease-snappy transition-[grid-template-columns,opacity] delay-[0ms,100ms] duration-[150ms,100ms] motion-reduce:transition-opacity starting:grid-cols-[0fr] starting:opacity-0"
      )}
    >
      <span className="min-w-0 overflow-hidden ps-1.5">{children}</span>
    </span>
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

function ViewLink({
  href,
  active,
  name,
  count,
  className,
  onDoubleClick,
}: ViewLinkProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        PILL,
        "aria-[current=page]:bg-input/64 dark:aria-[current=page]:bg-input aria-[current=page]:shadow-none",
        className
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

function DeleteViewButton({
  name,
  onConfirm,
}: {
  name: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <Hint label="Delete view">
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(PILL, "absolute inset-e-1 top-1/2 -translate-y-1/2")}
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
          <AlertDialogClose render={<Button variant="ghost" />}>
            Cancel
          </AlertDialogClose>
          <AlertDialogClose
            render={<Button variant="destructive" />}
            onClick={onConfirm}
          >
            Delete
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
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
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={() => {
          onCommit(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      {count !== undefined && (
        <InputGroupAddon align="inline-end">
          <Count>{count}</Count>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

interface ViewTabProps {
  view: View;
  count: number | undefined;
  active: boolean;
  deletable: boolean;
  renaming: boolean;
  href: string;
  onRenamingChange: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function ViewTab({
  view,
  count,
  active,
  deletable,
  renaming,
  href,
  onRenamingChange,
  onRename,
  onDelete,
}: ViewTabProps) {
  if (renaming) {
    return (
      <RenameInput
        name={view.name}
        count={count}
        onCommit={(name) => {
          onRename(view.id, name);
        }}
      />
    );
  }

  return (
    <div className="relative flex">
      <ViewLink
        href={href}
        active={active}
        name={view.name}
        count={count}
        className={cn(deletable && "pe-9 sm:pe-8")}
        onDoubleClick={() => {
          onRenamingChange(view.id);
        }}
      />
      {deletable && (
        <DeleteViewButton
          name={view.name}
          onConfirm={() => {
            onDelete(view.id);
          }}
        />
      )}
    </div>
  );
}

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

  const countsKey = [
    allOpenCount,
    ...views.map((view) => viewCounts[view.id]),
  ].join(",");

  const onTransitionEnd = useCenterActive(nav, activeViewId, countsKey);
  const panHandlers = usePanScroll(nav);

  return (
    <ScrollArea
      scrollFade
      className="-my-2 -ms-2 min-w-0 *:data-[slot=scroll-area-scrollbar]:hidden max-md:*:data-[slot=scroll-area-viewport]:overflow-hidden! md:-ms-4"
    >
      <motion.nav
        ref={nav}
        aria-label="Views"
        className="ease-snappy flex w-max gap-1.5 py-2 ps-2 transition-[translate] duration-300 motion-reduce:transition-none max-md:touch-pan-y md:ps-4"
        {...panHandlers}
        onTransitionEnd={onTransitionEnd}
      >
        <ViewLink
          href={viewHref(null)}
          active={activeViewId === null}
          name={ALL_OPEN_NAME}
          count={allOpenCount}
        />
        {views.map((view) => (
          <ViewTab
            key={view.id}
            view={view}
            count={viewCounts[view.id]}
            active={view.id === activeViewId}
            deletable={view.id === deletableViewId}
            renaming={view.id === renamingViewId}
            href={viewHref(view.id)}
            onRenamingChange={onRenamingViewChange}
            onRename={onRenameView}
            onDelete={onDeleteView}
          />
        ))}
      </motion.nav>
    </ScrollArea>
  );
}
