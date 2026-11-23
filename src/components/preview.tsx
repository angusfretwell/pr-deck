import {
  AlertIcon,
  ChevronDownIcon,
  GitPullRequestDraftIcon,
  XIcon,
} from "@primer/octicons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import parse, {
  attributesToProps,
  domToReact,
  Element,
} from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useResizeObserver } from "usehooks-ts";

import { OpenInButton } from "@/components/open-in-button";
import { BadgeIcon, BadgePill } from "@/components/status-badge";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine,
} from "@/components/ui/code-block";
import {
  Drawer,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { errorMessage } from "@/github/api";
import { usePullRequestDetail } from "@/github/hooks";
import { age, CHECK_BADGE, CONFLICT_BADGE, REVIEW_BADGE } from "@/lib/pr";
import { useHighlightedCode } from "@/lib/use-highlighted-code";
import { cn } from "@/lib/utils";
import type {
  Check,
  FileChange,
  PullRequest,
  PullRequestDetail,
} from "@/types";

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
    (file.additions / (file.additions + file.deletions || 1)) * DIFF_SQUARES
  );

  return (
    <span className="inline-flex shrink-0 gap-px">
      {Array.from({ length: DIFF_SQUARES }, (_, i) => (
        <i
          key={i}
          className={cn(
            "size-1.5 rounded-xs",
            i < added ? "bg-success" : "bg-destructive"
          )}
        />
      ))}
    </span>
  );
}

function duration(check: Check) {
  if (check.state === "pending") {
    return "running";
  }

  if (check.seconds === null || check.state === "skipped") {
    return null;
  }

  const minutes = Math.floor(check.seconds / 60);
  const seconds = check.seconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function updated(updatedAt: string) {
  const ago = age(updatedAt);

  return ago === "now" ? "just now" : `${ago} ago`;
}

function Section({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Lines({ children }: { children: ReactNode }) {
  return <div className="bg-card divide-y rounded-lg border">{children}</div>;
}

function Line({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-1.75">{children}</div>;
}

function ShowMore({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="px-1.5 py-1">
      <Button variant="ghost" size="sm" onClick={onClick}>
        <ChevronDownIcon />
        {children}
      </Button>
    </div>
  );
}

function SkeletonLines() {
  return (
    <Lines>
      {["w-1/2", "w-2/3", "w-2/5"].map((width) => (
        <Line key={width}>
          <span className="flex h-lh w-full items-center">
            <Skeleton className={cn("h-4.5", width)} />
          </span>
        </Line>
      ))}
    </Lines>
  );
}

function LoadError({ query }: { query: UseQueryResult<PullRequestDetail> }) {
  return (
    <Alert variant="error">
      <AlertIcon />
      <AlertTitle>Couldn't load details</AlertTitle>
      <AlertDescription>{errorMessage(query.error)}</AlertDescription>
      <AlertAction>
        <Button
          size="xs"
          variant="outline"
          loading={query.isFetching}
          onClick={async () => await query.refetch()}
        >
          Try again
        </Button>
      </AlertAction>
    </Alert>
  );
}

interface DetailProps {
  query: UseQueryResult<PullRequestDetail>;
  skeleton: ReactNode;
  children: (detail: PullRequestDetail) => ReactNode;
}

function Detail({ query, skeleton, children }: DetailProps) {
  return query.data ? children(query.data) : skeleton;
}

function FencedCode({ code, language }: { code: string; language: string }) {
  const lines = useHighlightedCode(code, language);

  return (
    <CodeBlock size="sm" className="[li>&]:mt-2">
      <CodeBlockActions>
        <CodeBlockCopyButton value={code} />
      </CodeBlockActions>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}

const GITHUB_LANGUAGE = /\bhighlight-(?:source|text)-(\S+)/;

const descriptionOptions: HTMLReactParserOptions = {
  replace(node) {
    if (!(node instanceof Element)) {
      return;
    }

    const code = node.attribs["data-snippet-clipboard-copy-content"];

    if (code !== undefined) {
      const language = GITHUB_LANGUAGE.exec(node.attribs.class)?.[1] ?? "";

      return <FencedCode code={code} language={language} />;
    }

    if (node.name === "table") {
      return (
        <div className="typeset-scroll">
          <table {...attributesToProps(node.attribs)}>
            {domToReact(node.children as DOMNode[], descriptionOptions)}
          </table>
        </div>
      );
    }

    if (node.name === "a" && node.attribs.href) {
      return (
        <a
          {...attributesToProps(node.attribs)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {domToReact(node.children as DOMNode[], descriptionOptions)}
        </a>
      );
    }
  },
};

function Description({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null!);
  const { height = 0 } = useResizeObserver({ ref });
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && height > DESCRIPTION_MAX_HEIGHT * 1.2;
  const content = useMemo(() => parse(html, descriptionOptions), [html]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          collapsed && "h-75 overflow-hidden mask-b-from-80%",
          expanded &&
            "ease-snappy overflow-hidden transition-[height] duration-250 [interpolate-size:allow-keywords] motion-reduce:transition-none"
        )}
      >
        <div
          ref={ref}
          className="typeset [--typeset-flow:1em] [--typeset-leading:1.6] [--typeset-size:var(--text-sm)]"
        >
          {content}
        </div>
      </div>
      {collapsed && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => {
            setExpanded(true);
          }}
        >
          <ChevronDownIcon />
          Show more
        </Button>
      )}
    </div>
  );
}

function CheckList({ checks }: { checks: Check[] }) {
  const [expanded, setExpanded] = useState(false);

  const sorted = checks.toSorted(
    (a, b) => CHECK_STATE_ORDER[a.state] - CHECK_STATE_ORDER[b.state]
  );

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
          <span className="text-muted-foreground/72 tabular-nums">
            {duration(check)}
          </span>
        </Line>
      ))}
      {shown.length < checks.length && (
        <ShowMore
          onClick={() => {
            setExpanded(true);
          }}
        >
          Show {checks.length - shown.length} more
        </ShowMore>
      )}
    </Lines>
  );
}

function LineCounts({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <>
      <span className="text-success-foreground">
        +{additions.toLocaleString()}
      </span>{" "}
      <span className="text-destructive-foreground">
        −{deletions.toLocaleString()}
      </span>
    </>
  );
}

const linesChanged = (file: FileChange) => file.additions + file.deletions;

function FilePath({ path }: { path: string }) {
  const split = path.lastIndexOf("/") + 1;

  return (
    <span
      title={path}
      className="flex min-w-0 flex-1 font-mono text-sm sm:text-xs"
    >
      <span className="truncate">{path.slice(0, split)}</span>
      <span className="max-w-full shrink-0 truncate">{path.slice(split)}</span>
    </span>
  );
}

function FileList({
  files,
  changedFiles,
}: {
  files: FileChange[];
  changedFiles: number;
}) {
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
          <span className="shrink-0">
            <LineCounts additions={file.additions} deletions={file.deletions} />
          </span>
          <DiffBar file={file} />
        </Line>
      ))}
      {shown.length < files.length ? (
        <ShowMore
          onClick={() => {
            setExpanded(true);
          }}
        >
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
  const query = usePullRequestDetail(pr.id);
  const you = (login: string) => (login === viewer ? " (you)" : "");

  return (
    <div className={cn("flex max-w-190 flex-col gap-5 pt-1.5", className)}>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl leading-[1.3] font-semibold tracking-[-0.01em] wrap-break-word sm:text-xl">
          {pr.title}
        </h2>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="inline-flex items-center gap-1.25">
            <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
            <span>
              {pr.author}
              {you(pr.author)} updated {updated(pr.updatedAt)}
            </span>
          </span>
          {query.data ? (
            <span>
              <LineCounts
                additions={query.data.additions}
                deletions={query.data.deletions}
              />{" "}
              · {query.data.changedFiles.toLocaleString()} files
            </span>
          ) : (
            query.isPending && <Skeleton className="h-3.5 w-28" />
          )}
          {pr.mergeability === "conflict" && (
            <BadgePill badge={CONFLICT_BADGE} />
          )}
          {pr.isDraft && (
            <Badge variant="secondary" className="font-[450]">
              <GitPullRequestDraftIcon className="-ms-0.5" />
              Draft
            </Badge>
          )}
        </div>
      </div>
      <OpenInButton url={pr.url} className="self-start" />
      {query.isError ? (
        <LoadError query={query} />
      ) : (
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
      )}
      <Section title="Reviewers">
        <Lines>
          {pr.statusPending && (
            <Line>
              <Skeleton className="h-3.5 w-40" />
            </Line>
          )}
          {!pr.statusPending && pr.reviewers.length === 0 && (
            <Line>
              <span className="text-muted-foreground">
                Nobody has reviewed this yet.
              </span>
            </Line>
          )}
          {pr.reviewers.map((reviewer) => (
            <Line key={reviewer.login}>
              <UserAvatar
                login={reviewer.login}
                avatarUrl={reviewer.avatarUrl}
              />
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
              {({ files, changedFiles }) => (
                <FileList files={files} changedFiles={changedFiles} />
              )}
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
      className="bg-background min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-s transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none starting:translate-x-4 starting:opacity-0"
    >
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
      onOpenChange={(next) => !next && onClose()}
    >
      <DrawerPopup
        showBar
        finalFocus={(closeType) => closeType === "keyboard"}
        className="h-[calc(100dvh-max(--spacing(2),env(safe-area-inset-top))---spacing(8))] [--peek:0px] [--stack-step:0] data-nested-drawer-open:h-[calc(100dvh-max(--spacing(2),env(safe-area-inset-top))---spacing(8))]"
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
