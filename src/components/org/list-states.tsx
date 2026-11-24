import { AlertIcon, GitPullRequestIcon } from "@primer/octicons-react";
import type { UseQueryResult } from "@tanstack/react-query";

import { QueryErrorEmpty, RefetchButton } from "@/components/query-error-empty";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PullRequestList } from "@/types";

const SKELETON_WIDTHS = ["w-80", "w-64", "w-96"];

export function LoadingRows() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2"
      aria-busy="true"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex h-10 items-center gap-3 px-2 sm:h-9">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton
            className={cn(
              "h-3",
              SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]
            )}
          />
          <span className="grow" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function NoPullRequests({
  owner,
  result,
}: {
  owner: string;
  result: UseQueryResult<PullRequestList>;
}) {
  return (
    <Empty>
      <EmptyHeader className="animate-rise motion-reduce:animate-none">
        <EmptyMedia variant="icon">
          <GitPullRequestIcon />
        </EmptyMedia>
        <EmptyTitle>No open pull requests</EmptyTitle>
        <EmptyDescription>{owner} is all clear.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <RefetchButton result={result}>Refresh</RefetchButton>
      </EmptyContent>
    </Empty>
  );
}

export function LoadErrorOrLoading({
  result,
}: {
  result: UseQueryResult<PullRequestList>;
}) {
  return result.isError ? (
    <QueryErrorEmpty
      icon={<AlertIcon />}
      title="Couldn't load pull requests"
      result={result}
    />
  ) : (
    <LoadingRows />
  );
}
