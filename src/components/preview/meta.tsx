import { GitPullRequestDraftIcon } from "@primer/octicons-react";

import { BadgePill } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { age, CONFLICT_BADGE } from "@/lib/pr";
import type { PullRequest } from "@/types";

import { usePreviewDetail } from "./detail";
import { LineCounts } from "./files";
import { you } from "./you";

function updated(updatedAt: string) {
  const ago = age(updatedAt);

  return ago === "now" ? "just now" : `${ago} ago`;
}

function DetailSummary() {
  const query = usePreviewDetail();

  if (query.data) {
    return (
      <span>
        <LineCounts
          additions={query.data.additions}
          deletions={query.data.deletions}
        />{" "}
        · {query.data.changedFiles.toLocaleString()} files
      </span>
    );
  }

  return query.isPending && <Skeleton className="h-3.5 w-28" />;
}

export function PreviewMeta({
  pr,
  viewer,
}: {
  pr: PullRequest;
  viewer: string;
}) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <span className="inline-flex items-center gap-1.25">
        <UserAvatar login={pr.author} avatarUrl={pr.authorAvatarUrl} />
        <span>
          {pr.author}
          {you(pr.author, viewer)} updated {updated(pr.updatedAt)}
        </span>
      </span>
      <DetailSummary />
      {pr.mergeability === "conflict" && <BadgePill badge={CONFLICT_BADGE} />}
      {pr.isDraft && (
        <Badge variant="secondary" className="font-[450]">
          <GitPullRequestDraftIcon className="-ms-0.5" />
          Draft
        </Badge>
      )}
    </div>
  );
}
