import { PlusIcon, XIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Group, GroupSeparator, GroupText } from "@/components/ui/group";
import { filterSummary, PROPERTY } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Filter, PropertyKey, PullRequest } from "@/types";
import { FilterTrigger } from "./filter-trigger";

interface FilterBarProps {
  filters: Filter[];
  orgPrs: PullRequest[];
  viewer: string;
  actions: ReactNode;
  onNegatedChange: (key: PropertyKey, negated: boolean) => void;
  onRemove: (index: number) => void;
}

function operator(filter: Filter) {
  if (filter.values.length > 1) return filter.negated ? "is not any of" : "is any of";
  return filter.negated ? "is not" : "is";
}

export function FilterBar({
  filters,
  orgPrs,
  viewer,
  actions,
  onNegatedChange,
  onRemove,
}: FilterBarProps) {
  return (
    <div className="mx-2 mb-2.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 md:mx-4">
      {filters.map((filter, index) => (
        <Group
          key={filter.key}
          aria-label={`${PROPERTY[filter.key].name} filter`}
          className="max-w-full *:rounded-full *:before:rounded-full"
        >
          <GroupText
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "pointer-events-none text-muted-foreground",
            )}
          >
            {PROPERTY[filter.key].name}
          </GroupText>
          <GroupSeparator />
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onNegatedChange(filter.key, !filter.negated)}
          >
            {operator(filter)}
          </Button>
          <GroupSeparator />
          <FilterTrigger
            anchor={filter.key}
            render={<Button variant="outline" size="sm" className="min-w-0 shrink" />}
          >
            <span className="truncate">{filterSummary(filter, orgPrs, viewer)}</span>
          </FilterTrigger>
          <GroupSeparator />
          <Button
            variant="outline"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Remove filter"
            onClick={() => onRemove(index)}
          >
            <XIcon />
          </Button>
        </Group>
      ))}
      <FilterTrigger
        anchor="add"
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Add filter"
          />
        }
      >
        <PlusIcon />
      </FilterTrigger>
      <span className="ms-auto flex items-center gap-1.5">{actions}</span>
    </div>
  );
}
