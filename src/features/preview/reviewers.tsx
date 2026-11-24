import { BadgePill } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { you } from "@/features/preview/lib/you";
import { REVIEW_BADGE } from "@/lib/pr";
import type { PullRequest } from "@/types";

import { Line, Lines, Section } from "./primitives";

export function ReviewerList({
  pr,
  viewer,
}: {
  pr: PullRequest;
  viewer: string;
}) {
  return (
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
            <UserAvatar login={reviewer.login} avatarUrl={reviewer.avatarUrl} />
            <span className="min-w-0 flex-1 truncate">
              {reviewer.login}
              {you(reviewer.login, viewer)}
            </span>
            <BadgePill badge={REVIEW_BADGE[reviewer.verdict]} />
          </Line>
        ))}
      </Lines>
    </Section>
  );
}
