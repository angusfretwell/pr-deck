import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { errorMessage } from "@/github/api";

type Refetchable = Pick<UseQueryResult, "isFetching" | "refetch">;

export function RefetchButton({
  result,
  children,
}: {
  result: Refetchable;
  children: ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      loading={result.isFetching}
      onClick={() => {
        void result.refetch();
      }}
    >
      {children}
    </Button>
  );
}

interface QueryErrorEmptyProps {
  icon: ReactNode;
  title: string;
  result: Refetchable & Pick<UseQueryResult, "error">;
}

export function QueryErrorEmpty({ icon, title, result }: QueryErrorEmptyProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{errorMessage(result.error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <RefetchButton result={result}>Try again</RefetchButton>
      </EmptyContent>
    </Empty>
  );
}
