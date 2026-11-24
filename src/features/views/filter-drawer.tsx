import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
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
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { UserAvatar } from "@/components/user-avatar";
import {
  facets,
  filterSummary,
  passes,
  PROPERTIES,
  PROPERTY,
  VIEWER_VALUE,
} from "@/features/views/lib/filters";
import { cn } from "@/lib/utils";
import type { PropertyKey } from "@/types";

import { useFilterContext } from "./filter-context";

const SEARCH_THRESHOLD = 6;

interface PropertyPaneProps {
  nested?: boolean;
  propertyKey: PropertyKey;
}

function PropertyPane({ nested = false, propertyKey }: PropertyPaneProps) {
  const context = useFilterContext("FilterDrawer");
  const { filters, orgPrs, scopedPrs } = context.state;
  const { toggle, setNegated, clear } = context.actions;
  const { viewer } = context.meta;
  const property = PROPERTY[propertyKey];
  const filter = filters.find((candidate) => candidate.key === propertyKey);

  const [pendingNegated, setPendingNegated] = useState(
    filter?.negated ?? false
  );

  const negated = filter?.negated ?? pendingNegated;
  const [query, setQuery] = useState("");

  const all = facets(property, filters, scopedPrs, orgPrs, viewer);
  const needle = query.trim().toLowerCase();

  const shown = all.filter((facet) =>
    facet.option.label.toLowerCase().includes(needle)
  );

  const avatarUrls = new Map(
    orgPrs.map((pr) => [pr.author, pr.authorAvatarUrl])
  );

  function changeNegated(next: boolean) {
    setPendingNegated(next);

    if (filter) {
      setNegated(propertyKey, next);
    }
  }

  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between gap-3">
        <DrawerTitle className="text-lg">{property.name}</DrawerTitle>
        <SegmentedControl
          size="sm"
          aria-label="Match"
          render={
            <RadioGroup
              value={negated}
              onValueChange={(next) => {
                changeNegated(next);
              }}
            />
          }
        >
          {[false, true].map((value) => (
            <SegmentedControlItem
              key={String(value)}
              render={<Radio.Root value={value} />}
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
              onChange={(event) => {
                setQuery(event.target.value);
              }}
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
                onCheckedChange={() => {
                  toggle(propertyKey, option.value, negated);
                }}
              >
                <span className="flex items-center gap-2">
                  {propertyKey === "author" && (
                    <span aria-hidden className="contents">
                      <UserAvatar
                        login={login}
                        avatarUrl={avatarUrls.get(login) ?? ""}
                      />
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  <span
                    className={cn(
                      "text-muted-foreground ms-auto text-sm tabular-nums",
                      count === 0 && "opacity-56"
                    )}
                  >
                    {count}
                  </span>
                </span>
              </DrawerMenuCheckboxItem>
            );
          })}
          {shown.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No matches
            </p>
          )}
        </DrawerMenu>
      </DrawerPanel>
      <DrawerFooter variant="bare">
        <Button
          variant="secondary"
          disabled={!filter}
          onClick={() => {
            clear(propertyKey);
          }}
        >
          Clear
        </Button>
        {!nested && <DrawerClose render={<Button />}>Done</DrawerClose>}
      </DrawerFooter>
    </>
  );
}

function PropertyList() {
  const context = useFilterContext("FilterDrawer");
  const { filters, scopedPrs, orgPrs } = context.state;
  const { clearAll } = context.actions;
  const { viewer } = context.meta;
  const count = scopedPrs.filter((pr) => passes(pr, filters, viewer)).length;

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-lg">Filters</DrawerTitle>
      </DrawerHeader>
      <DrawerPanel>
        <DrawerMenu>
          {PROPERTIES.map((property) => {
            const filter = filters.find(
              (candidate) => candidate.key === property.key
            );

            return (
              <Drawer key={property.key}>
                <DrawerMenuTrigger>
                  <span className="flex-1 truncate text-start">
                    {property.name}
                  </span>
                  <span
                    className={cn(
                      "max-w-1/2 truncate text-sm",
                      filter ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {filter
                      ? `${filter.negated ? "not " : ""}${filterSummary(filter, orgPrs, viewer)}`
                      : "Any"}
                  </span>
                </DrawerMenuTrigger>
                <DrawerPopup showBar>
                  <PropertyPane nested propertyKey={property.key} />
                </DrawerPopup>
              </Drawer>
            );
          })}
        </DrawerMenu>
      </DrawerPanel>
      <DrawerFooter variant="bare">
        <Button
          variant="secondary"
          disabled={filters.length === 0}
          onClick={clearAll}
        >
          Clear all
        </Button>
        <DrawerClose render={<Button />}>
          Show {count} pull request{count === 1 ? "" : "s"}
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

export function FilterDrawer() {
  const context = useFilterContext("FilterDrawer");
  const { drawerHandle, openTriggerId } = context.meta;
  const { changeMenu } = context.actions;

  return (
    <Drawer
      handle={drawerHandle}
      open={openTriggerId !== null}
      triggerId={openTriggerId}
      onOpenChange={(open, { trigger }) => {
        changeMenu(open, trigger);
      }}
    >
      {({ payload: anchor }) => {
        if (anchor === undefined) {
          return null;
        }

        return (
          <DrawerPopup showBar>
            {anchor === "header" || anchor === "add" ? (
              <PropertyList />
            ) : (
              <PropertyPane key={anchor} propertyKey={anchor} />
            )}
          </DrawerPopup>
        );
      }}
    </Drawer>
  );
}
