import { XIcon } from "@primer/octicons-react";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { PullRequest } from "@/types";

import { PreviewChecks } from "./checks";
import { PreviewDescription } from "./description";
import { PreviewDetailProvider } from "./detail";
import { PreviewFiles } from "./files";
import { PreviewMeta } from "./meta";
import { OpenInButton } from "./open-in-button";
import { ReviewerList } from "./reviewers";

export interface PreviewProps {
  pr: PullRequest;
  viewer: string;
  onClose: () => void;
}

function PreviewHeading({ pr }: { pr: PullRequest }) {
  return (
    <>
      <span className="truncate">{pr.repo}</span>
      <span className="text-muted-foreground/72 font-medium">#{pr.number}</span>
    </>
  );
}

function PreviewBody({
  pr,
  viewer,
  className,
}: {
  pr: PullRequest;
  viewer: string;
  className?: string;
}) {
  return (
    <PreviewDetailProvider prId={pr.id}>
      <div className={cn("flex max-w-190 flex-col gap-5 pt-1.5", className)}>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl leading-[1.3] font-semibold tracking-[-0.01em] wrap-break-word sm:text-xl">
            {pr.title}
          </h2>
          <PreviewMeta pr={pr} viewer={viewer} />
        </div>
        <OpenInButton url={pr.url} className="self-start" />
        <PreviewDescription />
        <ReviewerList pr={pr} viewer={viewer} />
        <PreviewChecks />
        <PreviewFiles />
      </div>
    </PreviewDetailProvider>
  );
}

function ScrollToTop({ target }: { target: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    target.current?.scrollTo({ top: 0 });
  }, [target]);

  return null;
}

export function Preview({ pr, viewer, onClose }: PreviewProps) {
  const ref = useRef<HTMLElement>(null);

  return (
    <aside
      ref={ref}
      aria-label="Pull request preview"
      className="bg-background min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-s transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none starting:translate-x-4 starting:opacity-0"
    >
      <ScrollToTop key={pr.id} target={ref} />
      <div className="flex items-center justify-between gap-2 py-2 ps-6 pe-2">
        <div className="flex min-w-0 gap-2 font-semibold">
          <PreviewHeading pr={pr} />
        </div>
        <Button
          aria-label="Close"
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <PreviewBody
        key={pr.id}
        pr={pr}
        viewer={viewer}
        className="px-6 pb-[calc(--spacing(12)+env(safe-area-inset-bottom))]"
      />
    </aside>
  );
}

export interface PreviewDrawerProps {
  pr: PullRequest | undefined;
  open: boolean;
  viewer: string;
  onClose: () => void;
}

export function PreviewDrawer({
  pr,
  open,
  viewer,
  onClose,
}: PreviewDrawerProps) {
  return (
    <Drawer
      open={open && pr !== undefined}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DrawerPopup
        showBar
        finalFocus={(closeType) => closeType === "keyboard"}
        className="h-[calc(100dvh-max(--spacing(2),env(safe-area-inset-top))-(--spacing(8)))] [--peek:0px] [--stack-step:0] data-nested-drawer-open:h-[calc(100dvh-max(--spacing(2),env(safe-area-inset-top))-(--spacing(8)))]"
      >
        {pr && (
          <DrawerPanel className="flex flex-col gap-5">
            <DrawerTitle className="flex min-w-0 gap-2 text-base leading-normal">
              <PreviewHeading pr={pr} />
            </DrawerTitle>
            <PreviewBody key={pr.id} pr={pr} viewer={viewer} />
          </DrawerPanel>
        )}
      </DrawerPopup>
    </Drawer>
  );
}
