import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { BadgeIcon, BadgePill } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const PROSE = cn(
  "prose prose-sm prose-neutral dark:prose-invert max-w-none text-[13px] leading-[1.55]",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
  "prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-[13px]",
  "prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-muted prose-pre:text-foreground",
  "prose-img:inline prose-img:h-auto prose-img:max-w-full [&_table]:block [&_table]:overflow-x-auto",
);

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
      <h3 className="mb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.05em]">
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

function SkeletonLines() {
  return (
    <Lines>
      {["w-1/2", "w-2/3", "w-2/5"].map((width) => (
        <Line key={width}>
          <Skeleton className={`h-4.5 ${width}`} />
        </Line>
      ))}
    </Lines>
  );
}

interface DetailProps {
  query: UseQueryResult<PullRequestDetail>;
  skeleton: ReactNode;
  children: (detail: PullRequestDetail) => ReactNode;
}

function Detail({ query, skeleton, children }: DetailProps) {
  if (query.data) return children(query.data);
  if (query.isError)
    return <p className="text-destructive-foreground">{errorMessage(query.error)}</p>;
  return skeleton;
}

function openLinksInNewTab(node: HTMLElement | null) {
  node?.querySelectorAll("a[href]").forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

export function Preview({ pr, viewer, onClose }: PreviewProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pr.id]);

  const query = usePullRequestDetail(pr.id);
  const you = (login: string) => (login === viewer ? " (you)" : "");

  return (
    <aside
      ref={ref}
      aria-label="Pull request preview"
      className="min-h-0 overflow-y-auto border-l bg-background text-[13px] transition-[opacity,translate] duration-200 ease-out starting:translate-x-4 starting:opacity-0 motion-reduce:transition-none"
    >
      <Button
        variant="ghost"
        size="sm"
        className="sticky top-2.5 z-10 float-right me-3 mt-2.5 bg-background text-muted-foreground"
        onClick={onClose}
      >
        Close
      </Button>
      <div className="max-w-190 px-6 pt-5 pb-12">
        <div className="flex gap-2 font-semibold">
          {pr.repo}
          <span className="font-medium text-muted-foreground/72">#{pr.number}</span>
        </div>
        <h2 className="mt-1.5 mb-2 font-semibold text-[19px] leading-[1.3] tracking-[-0.01em]">
          {pr.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-muted-foreground">
          <span className="inline-flex items-center gap-1.25">
            <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
            {pr.author}
            {you(pr.author)}
          </span>
          <span>updated {updated(pr.updatedAt)}</span>
          {query.data ? (
            <span>
              <span className="text-success-foreground">+{query.data.additions}</span>{" "}
              <span className="text-destructive-foreground">−{query.data.deletions}</span> ·{" "}
              {query.data.changedFiles} files
            </span>
          ) : (
            query.isPending && <Skeleton className="h-3.5 w-28" />
          )}
          {pr.mergeability === "conflict" && <BadgePill badge={CONFLICT_BADGE} />}
          {pr.isDraft && (
            <Badge variant="outline" className="text-muted-foreground">
              Draft
            </Badge>
          )}
        </div>
        <div className="mt-4 mb-5">
          <Button render={<a href={pr.url} target="_blank" rel="noopener" />}>
            Open in GitHub
          </Button>
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
                <div
                  ref={openLinksInNewTab}
                  className={PROSE}
                  dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                />
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
        <Section title="Checks">
          <Detail query={query} skeleton={<SkeletonLines />}>
            {({ checks }) => (
              <Lines>
                {checks.length === 0 && (
                  <Line>
                    <span className="text-muted-foreground">No checks.</span>
                  </Line>
                )}
                {checks.map((check) => (
                  <Line key={check.name}>
                    <BadgeIcon badge={CHECK_BADGE[check.state]} />
                    <span className="min-w-0 flex-1 truncate">{check.name}</span>
                    <span className="text-muted-foreground/72 tabular-nums">{duration(check)}</span>
                  </Line>
                ))}
              </Lines>
            )}
          </Detail>
        </Section>
        <Section title={`Files changed${query.data ? ` · ${query.data.changedFiles}` : ""}`}>
          <Detail query={query} skeleton={<SkeletonLines />}>
            {({ files, changedFiles }) => (
              <Lines>
                {files.map((file) => (
                  <Line key={file.path}>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{file.path}</span>
                    <span className="text-success-foreground tabular-nums">+{file.additions}</span>
                    <span className="text-destructive-foreground tabular-nums">
                      −{file.deletions}
                    </span>
                    <DiffBar file={file} />
                  </Line>
                ))}
                {changedFiles > files.length && (
                  <Line>
                    <span className="text-muted-foreground">
                      and {changedFiles - files.length} more
                    </span>
                  </Line>
                )}
              </Lines>
            )}
          </Detail>
        </Section>
      </div>
    </aside>
  );
}
