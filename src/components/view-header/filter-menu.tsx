import { ChevronRightIcon, SearchIcon } from "@primer/octicons-react";
import { useState } from "react";

import {
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Command } from "@/components/ui/command";
import { Popover, PopoverPopup } from "@/components/ui/popover";
import type { PopoverPrimitive } from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { facets, PROPERTIES, PROPERTY, VIEWER_VALUE } from "@/lib/filters";
import type { Option, Property } from "@/lib/filters";
import type { Filter, PropertyKey, PullRequest } from "@/types";

import type { MenuAnchor } from "./filter-trigger-context";

type Item =
  | { kind: "property"; property: Property }
  | {
      kind: "value";
      property: Property;
      option: Option;
      prefixed: boolean;
      checked: boolean;
      count: number;
    };

function itemKey(item: Item) {
  return item.kind === "value"
    ? `${item.property.key}:${item.option.value}`
    : item.property.key;
}

interface FilterMenuProps {
  handle: PopoverPrimitive.Handle<MenuAnchor>;
  triggerId: string | null;
  onOpenChange: (open: boolean, trigger: Element | undefined) => void;
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  filters: Filter[];
  viewer: string;
  onToggle: (key: PropertyKey, value: string) => void;
}

interface FilterMenuListProps {
  initialKey: PropertyKey | null;
  canGoBack: boolean;
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  filters: Filter[];
  viewer: string;
  onToggle: (key: PropertyKey, value: string) => void;
}

function FilterMenuList({
  initialKey,
  canGoBack,
  orgPrs,
  scopedPrs,
  filters,
  viewer,
  onToggle,
}: FilterMenuListProps) {
  const [propertyKey, setPropertyKey] = useState(initialKey);
  const [query, setQuery] = useState("");

  const avatarUrls = new Map(
    orgPrs.map((pr) => [pr.author, pr.authorAvatarUrl])
  );

  function avatarOf(item: Extract<Item, { kind: "value" }>) {
    if (item.property.key !== "author") {
      return null;
    }

    const login =
      item.option.value === VIEWER_VALUE ? viewer : item.option.value;

    return (
      <UserAvatar
        login={login}
        avatarUrl={avatarUrls.get(login) ?? ""}
        className="sm:[--avatar-size:--spacing(4)]"
      />
    );
  }

  const needle = query.trim().toLowerCase();

  function matches(label: string) {
    return label.toLowerCase().includes(needle);
  }

  function valueItems(property: Property, prefixed: boolean) {
    return facets(property, filters, scopedPrs, orgPrs, viewer)
      .filter(({ option }) => matches(option.label))
      .map(
        (facet) =>
          ({ kind: "value", property, prefixed, ...facet }) satisfies Item
      );
  }

  const items: Item[] = propertyKey
    ? valueItems(PROPERTY[propertyKey], false)
    : [
        ...PROPERTIES.filter((property) => matches(property.name)).map(
          (property) =>
            ({
              kind: "property",
              property,
            }) satisfies Item
        ),
        ...(needle
          ? PROPERTIES.flatMap((property) => valueItems(property, true))
          : []),
      ];

  function pick(item: Item) {
    if (item.kind === "value") {
      onToggle(item.property.key, item.option.value);

      return;
    }

    setPropertyKey(item.property.key);
    setQuery("");
  }

  return (
    <div className="flex max-h-[min(calc(var(--available-height)-2px),24rem)] flex-col *:first:border-b">
      <Command
        key={propertyKey}
        items={items}
        mode="none"
        value={query}
        onValueChange={(value, { reason }) => {
          if (reason !== "item-press") {
            setQuery(value);
          }
        }}
      >
        <div className="p-2">
          <AutocompleteInput
            autoFocus
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder={
              propertyKey ? `${PROPERTY[propertyKey].name}…` : "Filter…"
            }
            spellCheck={false}
            startAddon={<SearchIcon />}
            onKeyDown={(event) => {
              if (
                event.key === "Backspace" &&
                !query &&
                propertyKey &&
                canGoBack
              ) {
                setPropertyKey(null);
              }
            }}
          />
        </div>
        <AutocompleteEmpty>No matches</AutocompleteEmpty>
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
          <AutocompleteList>
            {(item: Item) => (
              <AutocompleteItem
                key={itemKey(item)}
                value={item}
                className="gap-2"
                onClick={() => {
                  pick(item);
                }}
              >
                {item.kind === "value" ? (
                  <>
                    <Checkbox
                      checked={item.checked}
                      tabIndex={-1}
                      aria-hidden
                    />
                    {avatarOf(item)}
                    {item.prefixed && (
                      <span className="text-muted-foreground shrink-0">
                        {item.property.name}
                      </span>
                    )}
                    <span className="truncate">{item.option.label}</span>
                    <span className="text-muted-foreground ms-auto text-sm tabular-nums sm:text-xs">
                      {item.count}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{item.property.name}</span>
                    <ChevronRightIcon className="text-muted-foreground ms-auto size-4 sm:size-3.5" />
                  </>
                )}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </div>
      </Command>
    </div>
  );
}

export function FilterMenu({
  handle,
  triggerId,
  onOpenChange,
  ...list
}: FilterMenuProps) {
  return (
    <Popover
      handle={handle}
      open={triggerId !== null}
      triggerId={triggerId}
      onOpenChange={(open, { trigger }) => {
        onOpenChange(open, trigger);
      }}
    >
      {({ payload: anchor }) => {
        if (anchor === undefined) {
          return null;
        }

        const chipKey = anchor === "header" || anchor === "add" ? null : anchor;

        return (
          <PopoverPopup
            align={anchor === "header" ? "end" : "start"}
            className="w-72 *:data-[slot=popover-viewport]:py-0 *:data-[slot=popover-viewport]:[--viewport-inline-padding:0] sm:w-62.5"
          >
            <FilterMenuList
              key={anchor}
              initialKey={chipKey}
              canGoBack={chipKey === null}
              {...list}
            />
          </PopoverPopup>
        );
      }}
    </Popover>
  );
}
