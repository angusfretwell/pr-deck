import type { UseQueryResult } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, CircleAlertIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useResizeObserver } from "usehooks-ts";
import { BadgeIcon, BadgePill, pillClassName } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerPanel, DrawerPopup, DrawerTitle } from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { errorMessage } from "@/github/api";
import { usePullRequestDetail } from "@/github/hooks";
import { age, CHECK_BADGE, CONFLICT_BADGE, REVIEW_BADGE } from "@/lib/pr";
import { cn } from "@/lib/utils";
import type { Check, FileChange, PullRequest, PullRequestDetail } from "@/types";

export interface PreviewProps {
  pr: PullRequest;
  viewer: string;
  onClose: () => void;
}

const DIFF_SQUARES = 5;
const DESCRIPTION_MAX_HEIGHT = 300;
const PREVIEWED_FILES = 5;
const CHECK_STATE_ORDER: Record<Check["state"], number> = {
  fail: 0,
  pending: 1,
  pass: 2,
  skipped: 3,
};

function DiffBar({ file }: { file: FileChange }) {
  const added = Math.round(
    (file.additions / (file.additions + file.deletions || 1)) * DIFF_SQUARES,
  );
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: DIFF_SQUARES }, (_, i) => (
        <i
          key={i}
          className={`size-1.5 rounded-[1px] ${i < added ? "bg-success" : "bg-destructive"}`}
        />
      ))}
    </span>
  );
}

function duration(check: Check) {
  if (check.state === "pending") return "running";
  if (check.seconds === null || check.state === "skipped") return null;
  const minutes = Math.floor(check.seconds / 60);
  const seconds = check.seconds % 60;
  if (!minutes) return `${seconds}s`;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function updated(updatedAt: string) {
  const ago = age(updatedAt);
  return ago === "now" ? "just now" : `${ago} ago`;
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-5.5">
      <h3 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.05em]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Lines({ children }: { children: ReactNode }) {
  return <div className="divide-y rounded-lg border bg-card">{children}</div>;
}

function Line({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-1.75">{children}</div>;
}

function ShowMore({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-1.75 text-muted-foreground hover:text-foreground"
    >
      <ChevronDownIcon className="size-3.5" />
      {children}
    </button>
  );
}

function SkeletonLines() {
  return (
    <Lines>
      {["w-1/2", "w-2/3", "w-2/5"].map((width) => (
        <Line key={width}>
          <span className="flex h-lh w-full items-center">
            <Skeleton className={`h-4.5 ${width}`} />
          </span>
        </Line>
      ))}
    </Lines>
  );
}

function LoadError({ query }: { query: UseQueryResult<PullRequestDetail> }) {
  return (
    <Empty className="rounded-lg border py-8 md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle className="text-base">Couldn't load details</EmptyTitle>
        <EmptyDescription>{errorMessage(query.error)}</EmptyDescription>
      </EmptyHeader>
      <Button
        size="sm"
        variant="outline"
        loading={query.isFetching}
        onClick={() => query.refetch()}
      >
        Try again
      </Button>
    </Empty>
  );
}

interface DetailProps {
  query: UseQueryResult<PullRequestDetail>;
  skeleton: ReactNode;
  children: (detail: PullRequestDetail) => ReactNode;
}

function Detail({ query, skeleton, children }: DetailProps) {
  if (query.data) return children(query.data);
  if (query.isError) return <LoadError query={query} />;
  return skeleton;
}

function Description({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null!);
  const { height = 0 } = useResizeObserver({ ref });
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && height > DESCRIPTION_MAX_HEIGHT * 1.2;

  useEffect(() => {
    ref.current.querySelectorAll("table").forEach((table) => {
      if (table.parentElement?.classList.contains("typeset-scroll")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "typeset-scroll";
      table.replaceWith(wrapper);
      wrapper.append(table);
    });
    ref.current.querySelectorAll("a[href]").forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }, [html]);

  return (
    <>
      <div className={cn(collapsed && "max-h-75 overflow-hidden mask-b-from-80%")}>
        <div
          ref={ref}
          className="typeset [--typeset-flow:1em] [--typeset-leading:1.6] [--typeset-size:var(--text-sm)]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {(collapsed || expanded) && (
        <div className="mt-2 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {expanded ? "Show less" : "Show more"}
          </Button>
        </div>
      )}
    </>
  );
}

function CheckList({ checks }: { checks: Check[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = checks.toSorted((a, b) => CHECK_STATE_ORDER[a.state] - CHECK_STATE_ORDER[b.state]);
  const required = sorted.filter((check) => check.required);
  const shown = expanded || required.length === 0 ? sorted : required;

  return (
    <Lines>
      {checks.length === 0 && (
        <Line>
          <span className="text-muted-foreground">No checks.</span>
        </Line>
      )}
      {shown.map((check) => (
        <Line key={check.name}>
          <BadgeIcon badge={CHECK_BADGE[check.state]} />
          <span className="min-w-0 flex-1 truncate">
            {check.url ? (
              <a
                href={check.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {check.name}
              </a>
            ) : (
              check.name
            )}
          </span>
          <span className="text-muted-foreground/72 tabular-nums">{duration(check)}</span>
        </Line>
      ))}
      {shown.length < checks.length && (
        <ShowMore onClick={() => setExpanded(true)}>
          Show {checks.length - shown.length} more
        </ShowMore>
      )}
    </Lines>
  );
}

const linesChanged = (file: FileChange) => file.additions + file.deletions;

function FilePath({ path }: { path: string }) {
  const split = path.lastIndexOf("/") + 1;
  return (
    <span title={path} className="flex min-w-0 flex-1 font-mono text-xs">
      <span className="truncate">{path.slice(0, split)}</span>
      <span className="shrink-0">{path.slice(split)}</span>
    </span>
  );
}

function FileList({ files, changedFiles }: { files: FileChange[]; changedFiles: number }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = files.toSorted((a, b) => linesChanged(b) - linesChanged(a));
  const shown = expanded ? sorted : sorted.slice(0, PREVIEWED_FILES);

  return (
    <Lines>
      {files.length === 0 && (
        <Line>
          <span className="text-muted-foreground">No files changed.</span>
        </Line>
      )}
      {shown.map((file) => (
        <Line key={file.path}>
          <FilePath path={file.path} />
          <span className="text-success-foreground tabular-nums">
            +{file.additions.toLocaleString()}
          </span>
          <span className="text-destructive-foreground tabular-nums">
            −{file.deletions.toLocaleString()}
          </span>
          <DiffBar file={file} />
        </Line>
      ))}
      {shown.length < files.length ? (
        <ShowMore onClick={() => setExpanded(true)}>
          Show {(files.length - shown.length).toLocaleString()} more
        </ShowMore>
      ) : (
        changedFiles > files.length && (
          <Line>
            <span className="text-muted-foreground">
              and {(changedFiles - files.length).toLocaleString()} more
            </span>
          </Line>
        )
      )}
    </Lines>
  );
}

function PreviewHeading({ pr }: { pr: PullRequest }) {
  return (
    <div className="flex min-w-0 gap-2 font-semibold">
      <span className="truncate">{pr.repo}</span>
      <span className="font-medium text-muted-foreground/72">#{pr.number}</span>
    </div>
  );
}

function PreviewBody({
  pr,
  viewer,
  className,
}: {
  pr: PullRequest;
  viewer: string;
  className: string;
}) {
  const query = usePullRequestDetail(pr.id);
  const you = (login: string) => (login === viewer ? " (you)" : "");

  return (
    <div
      className={cn("max-w-190 pb-[calc(--spacing(12)+env(safe-area-inset-bottom))]", className)}
    >
      <h2 className="mt-1.5 mb-2 wrap-break-word font-semibold text-2xl leading-[1.3] sm:text-xl tracking-[-0.01em]">
        {pr.title}
      </h2>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-muted-foreground">
        <span className="inline-flex items-center gap-1.25">
          <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
          <span>
            {pr.author}
            {you(pr.author)} updated {updated(pr.updatedAt)}
          </span>
        </span>
        {query.data ? (
          <span>
            <span className="text-success-foreground">
              +{query.data.additions.toLocaleString()}
            </span>{" "}
            <span className="text-destructive-foreground">
              −{query.data.deletions.toLocaleString()}
            </span>{" "}
            · {query.data.changedFiles.toLocaleString()} files
          </span>
        ) : (
          query.isPending && <Skeleton className="h-3.5 w-28" />
        )}
        {pr.mergeability === "conflict" && <BadgePill badge={CONFLICT_BADGE} />}
        {pr.isDraft && (
          <Badge variant="secondary" className={pillClassName}>
            Draft
          </Badge>
        )}
      </div>
      <div className="mt-4 mb-5">
        <Button render={<a href={pr.url} target="_blank" rel="noopener" />}>Open in GitHub</Button>
      </div>
      <Section title="Description">
        <Detail
          query={query}
          skeleton={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          }
        >
          {(detail) =>
            detail.bodyHtml ? (
              <Description html={detail.bodyHtml} />
            ) : (
              <p className="text-muted-foreground">No description.</p>
            )
          }
        </Detail>
      </Section>
      <Section title="Reviewers">
        <Lines>
          {pr.reviewers.length === 0 && (
            <Line>
              <span className="text-muted-foreground">Nobody has reviewed this yet.</span>
            </Line>
          )}
          {pr.reviewers.map((reviewer) => (
            <Line key={reviewer.login}>
              <UserAvatar login={reviewer.login} avatarUrl={reviewer.avatarUrl} />
              <span className="min-w-0 flex-1 truncate">
                {reviewer.login}
                {you(reviewer.login)}
              </span>
              <BadgePill badge={REVIEW_BADGE[reviewer.verdict]} />
            </Line>
          ))}
        </Lines>
      </Section>
      {!query.isError && (
        <>
          <Section title="Checks">
            <Detail query={query} skeleton={<SkeletonLines />}>
              {({ checks }) => <CheckList checks={checks} />}
            </Detail>
          </Section>
          <Section
            title={`Files changed${query.data ? ` · ${query.data.changedFiles.toLocaleString()}` : ""}`}
          >
            <Detail query={query} skeleton={<SkeletonLines />}>
              {({ files, changedFiles }) => <FileList files={files} changedFiles={changedFiles} />}
            </Detail>
          </Section>
        </>
      )}
    </div>
  );
}

export function Preview({ pr, viewer, onClose }: PreviewProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pr.id]);

  return (
    <aside
      ref={ref}
      aria-label="Pull request preview"
      className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-l bg-background transition-[opacity,translate] duration-200 ease-out starting:translate-x-4 starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background py-2 ps-6 pe-2">
        <PreviewHeading pr={pr} />
        <Button aria-label="Close" variant="ghost" size="icon" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      <PreviewBody key={pr.id} pr={pr} viewer={viewer} className="px-6 pt-1" />
    </aside>
  );
}

export interface PreviewDrawerProps {
  pr: PullRequest | undefined;
  open: boolean;
  viewer: string;
  onClose: () => void;
}

export function PreviewDrawer({ pr, open, viewer, onClose }: PreviewDrawerProps) {
  return (
    <Drawer open={open && pr !== undefined} onOpenChange={(next) => !next && onClose()}>
      <DrawerPopup
        showBar
        className="h-[calc(100dvh-max(--spacing(2),env(safe-area-inset-top))---spacing(8))] text-base sm:text-sm"
      >
        {pr && (
          <DrawerPanel className="p-0">
            <DrawerTitle
              render={<div />}
              className="px-4 pt-3 font-normal text-base leading-normal sm:text-sm"
            >
              <PreviewHeading pr={pr} />
            </DrawerTitle>
            <PreviewBody key={pr.id} pr={pr} viewer={viewer} className="px-4 pt-1" />
          </DrawerPanel>
        )}
      </DrawerPopup>
    </Drawer>
  );
}
