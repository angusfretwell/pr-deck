import { PlusIcon, XIcon } from "lucide-react";
import type { ReactNode, RefCallback } from "react";
import { Button } from "@/components/ui/button";
import { PROPERTY } from "@/lib/filters";
import type { Filter, PullRequest } from "@/types";
import type { MenuAnchor } from "../ViewHeader";
import { FILTER_TRIGGER } from "./FilterMenu";

const SEGMENT = "inline-flex items-center px-2 transition-colors hover:bg-accent";

interface FilterBarProps {
  filters: Filter[];
  orgPrs: PullRequest[];
  viewer: string;
  actions: ReactNode;
  anchorRef: (anchor: MenuAnchor) => RefCallback<HTMLElement>;
  onToggleMenu: (anchor: MenuAnchor) => void;
  onNegate: (index: number) => void;
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
  anchorRef,
  onToggleMenu,
  onNegate,
  onRemove,
}: FilterBarProps) {
  const trigger = { [FILTER_TRIGGER]: "" };

  const summary = (filter: Filter) => {
    const property = PROPERTY[filter.key];
    const options = property.options(orgPrs, viewer);
    const labels = filter.values.map(
      (value) => options.find((option) => option.value === value)?.label ?? value,
    );
    return labels.length > 2 ? `${labels.length} ${property.noun}` : labels.join(", ");
  };

  return (
    <div className="mx-2 mb-2.5 flex md:mx-4 flex-wrap items-center gap-1.5 rounded-[10px] bg-muted px-2 py-1.5">
      {filters.map((filter, index) => (
        <span
          key={filter.key}
          ref={anchorRef(index)}
          className="inline-flex h-8 items-stretch sm:h-7 divide-x overflow-hidden whitespace-nowrap rounded-md border bg-background"
        >
          <span className="inline-flex items-center px-2 text-muted-foreground">
            {PROPERTY[filter.key].name}
          </span>
          <button
            type="button"
            className={`${SEGMENT} text-muted-foreground`}
            onClick={() => onNegate(index)}
          >
            {operator(filter)}
          </button>
          <button
            type="button"
            className={`${SEGMENT} font-medium text-foreground`}
            {...trigger}
            onClick={() => onToggleMenu(index)}
          >
            {summary(filter)}
          </button>
          <button
            type="button"
            className={`${SEGMENT} text-muted-foreground`}
            aria-label="Remove filter"
            onClick={() => onRemove(index)}
          >
            <XIcon className="size-3.5 sm:size-3" />
          </button>
        </span>
      ))}
      <Button
        ref={anchorRef("add")}
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label="Add filter"
        {...trigger}
        onClick={() => onToggleMenu("add")}
      >
        <PlusIcon />
      </Button>
      <span className="ms-auto flex items-center gap-1.5">{actions}</span>
    </div>
  );
}
