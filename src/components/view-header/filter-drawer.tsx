import { SearchIcon } from "@primer/octicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerMenu,
  DrawerMenuCheckboxItem,
  DrawerMenuTrigger,
  DrawerPanel,
  DrawerPopup,
  type DrawerPrimitive,
  DrawerTitle,
} from "@/components/ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { UserAvatar } from "@/components/user-avatar";
import { facets, filterSummary, passes, PROPERTIES, PROPERTY, VIEWER_VALUE } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Filter, PropertyKey, PullRequest } from "@/types";
import type { MenuAnchor } from "./filter-trigger-context";

const SEARCH_THRESHOLD = 6;

interface FilterDrawerContentProps {
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  filters: Filter[];
  viewer: string;
  onToggle: (key: PropertyKey, value: string, negated: boolean) => void;
  onNegatedChange: (key: PropertyKey, negated: boolean) => void;
  onClear: (key: PropertyKey) => void;
  onClearAll: () => void;
}

interface FilterDrawerProps extends FilterDrawerContentProps {
  handle: DrawerPrimitive.Handle<MenuAnchor>;
  triggerId: string | null;
  onOpenChange: (open: boolean, trigger: Element | undefined) => void;
}

export function FilterDrawer({ handle, triggerId, onOpenChange, ...content }: FilterDrawerProps) {
  return (
    <Drawer
      handle={handle}
      open={triggerId !== null}
      triggerId={triggerId}
      onOpenChange={(open, { trigger }) => onOpenChange(open, trigger)}
    >
      {({ payload }) => {
        const anchor = payload as MenuAnchor | undefined;
        if (anchor === undefined) return null;
        return (
          <DrawerPopup showBar>
            {anchor === "header" || anchor === "add" ? (
              <PropertyList {...content} />
            ) : (
              <PropertyPane key={anchor} propertyKey={anchor} {...content} />
            )}
          </DrawerPopup>
        );
      }}
    </Drawer>
  );
}

function PropertyList(props: FilterDrawerContentProps) {
  const { filters, scopedPrs, orgPrs, viewer, onClearAll } = props;
  const count = scopedPrs.filter((pr) => passes(pr, filters, viewer)).length;
  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-lg">Filters</DrawerTitle>
      </DrawerHeader>
      <DrawerPanel>
        <DrawerMenu>
          {PROPERTIES.map((property) => {
            const filter = filters.find((candidate) => candidate.key === property.key);
            return (
              <Drawer key={property.key}>
                <DrawerMenuTrigger>
                  <span className="flex-1 truncate text-start">{property.name}</span>
                  <span
                    className={cn(
                      "max-w-1/2 truncate text-sm",
                      filter ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {filter
                      ? `${filter.negated ? "not " : ""}${filterSummary(filter, orgPrs, viewer)}`
                      : "Any"}
                  </span>
                </DrawerMenuTrigger>
                <DrawerPopup showBar>
                  <PropertyPane nested propertyKey={property.key} {...props} />
                </DrawerPopup>
              </Drawer>
            );
          })}
        </DrawerMenu>
      </DrawerPanel>
      <DrawerFooter variant="bare">
        <Button variant="secondary" disabled={filters.length === 0} onClick={onClearAll}>
          Clear all
        </Button>
        <DrawerClose render={<Button />}>
          Show {count} pull request{count === 1 ? "" : "s"}
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

interface PropertyPaneProps extends FilterDrawerContentProps {
  nested?: boolean;
  propertyKey: PropertyKey;
}

function PropertyPane({
  nested = false,
  propertyKey,
  orgPrs,
  scopedPrs,
  filters,
  viewer,
  onToggle,
  onNegatedChange,
  onClear,
}: PropertyPaneProps) {
  const property = PROPERTY[propertyKey];
  const filter = filters.find((candidate) => candidate.key === propertyKey);
  const [pendingNegated, setPendingNegated] = useState(filter?.negated ?? false);
  const negated = filter?.negated ?? pendingNegated;
  const [query, setQuery] = useState("");

  const all = facets(property, filters, scopedPrs, orgPrs, viewer);
  const needle = query.trim().toLowerCase();
  const shown = all.filter((facet) => facet.option.label.toLowerCase().includes(needle));
  const avatarUrls = new Map(orgPrs.map((pr) => [pr.author, pr.authorAvatarUrl]));

  const changeNegated = (next: boolean) => {
    setPendingNegated(next);
    if (filter) onNegatedChange(propertyKey, next);
  };

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between gap-3">
        <DrawerTitle className="text-lg">{property.name}</DrawerTitle>
        <SegmentedControl size="sm" role="radiogroup" aria-label="Match">
          {[false, true].map((value) => (
            <SegmentedControlItem
              key={String(value)}
              role="radio"
              aria-checked={negated === value}
              data-checked={negated === value || undefined}
              onClick={() => changeNegated(value)}
            >
              {value ? "is not" : "is"}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </DrawerHeader>
      {all.length > SEARCH_THRESHOLD && (
        <div className="px-6 pb-4">
          <InputGroup>
            <InputGroupInput
              type="search"
              aria-label={`Search ${property.noun}`}
              placeholder={`Search ${property.noun}`}
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
      <DrawerPanel>
        <DrawerMenu>
          {shown.map(({ option, checked, count }) => {
            const login = option.value === VIEWER_VALUE ? viewer : option.value;
            return (
              <DrawerMenuCheckboxItem
                key={option.value}
                checked={checked}
                onCheckedChange={() => onToggle(propertyKey, option.value, negated)}
              >
                <span className="flex items-center gap-2">
                  {propertyKey === "author" && (
                    <span aria-hidden className="contents">
                      <UserAvatar login={login} avatarUrl={avatarUrls.get(login) ?? ""} />
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  <span
                    className={cn(
                      "ms-auto text-muted-foreground text-sm tabular-nums",
                      count === 0 && "opacity-56",
                    )}
                  >
                    {count}
                  </span>
                </span>
              </DrawerMenuCheckboxItem>
            );
          })}
          {shown.length === 0 && (
            <p className="py-6 text-center text-muted-foreground text-sm">No matches</p>
          )}
        </DrawerMenu>
      </DrawerPanel>
      <DrawerFooter variant="bare">
        <Button variant="secondary" disabled={!filter} onClick={() => onClear(propertyKey)}>
          Clear
        </Button>
        {!nested && <DrawerClose render={<Button />}>Done</DrawerClose>}
      </DrawerFooter>
    </>
  );
}
