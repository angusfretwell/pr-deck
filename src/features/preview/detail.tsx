import { AlertIcon } from "@primer/octicons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, use } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/github/api";
import { usePullRequestDetail } from "@/github/hooks";
import type { PullRequestDetail } from "@/types";

type DetailQuery = UseQueryResult<PullRequestDetail>;

const PreviewDetailContext = createContext<DetailQuery | null>(null);

export function PreviewDetailProvider({
  prId,
  children,
}: {
  prId: string;
  children: ReactNode;
}) {
  const query = usePullRequestDetail(prId);

  return <PreviewDetailContext value={query}>{children}</PreviewDetailContext>;
}

export function usePreviewDetail() {
  const query = use(PreviewDetailContext);

  if (!query) {
    throw new Error(
      "usePreviewDetail must be used within PreviewDetailProvider"
    );
  }

  return query;
}

export function LoadError() {
  const query = usePreviewDetail();

  return (
    <Alert variant="error">
      <AlertIcon />
      <AlertTitle>Couldn&apos;t load details</AlertTitle>
      <AlertDescription>{errorMessage(query.error)}</AlertDescription>
      <AlertAction>
        <Button
          size="xs"
          variant="outline"
          loading={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          Try again
        </Button>
      </AlertAction>
    </Alert>
  );
}
