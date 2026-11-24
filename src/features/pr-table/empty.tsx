import { FilterRemoveIcon, SearchIcon } from "@primer/octicons-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function PrTableEmpty({
  query,
  onClearSearch,
  onShowAll,
}: {
  query: string;
  onClearSearch: () => void;
  onShowAll: () => void;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {query ? <SearchIcon /> : <FilterRemoveIcon />}
        </EmptyMedia>
        <EmptyTitle>
          {query ? `No results for "${query}"` : "Nothing matches this view"}
        </EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          onClick={query ? onClearSearch : onShowAll}
        >
          {query ? "Clear search" : "Show all open"}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
