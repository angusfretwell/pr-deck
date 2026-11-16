import { ChevronRightIcon } from "@primer/octicons-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverPopup, type PopoverPrimitive } from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import {
  type Option,
  passes,
  PROPERTIES,
  PROPERTY,
  type Property,
  VIEWER_VALUE,
} from "@/lib/filters";
import type { Filter, PropertyKey, PullRequest } from "@/types";
import type { MenuAnchor } from "../view-header";

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

const itemKey = (item: Item) =>
  item.kind === "value" ? `${item.property.key}:${item.option.value}` : item.property.key;

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

export function FilterMenu({ handle, triggerId, onOpenChange, ...list }: FilterMenuProps) {
  return (
    <Popover
      handle={handle}
      open={triggerId !== null}
      triggerId={triggerId}
      onOpenChange={(open, { trigger }) => onOpenChange(open, trigger)}
    >
      {({ payload: anchor }) => {
        if (anchor === undefined) return null;
        const chipKey = anchor === "header" || anchor === "add" ? null : anchor;
        return (
          <PopoverPopup
            align={anchor === "header" ? "end" : "start"}
            className="w-72 sm:w-62.5 *:data-[slot=popover-viewport]:py-0 *:data-[slot=popover-viewport]:[--viewport-inline-padding:0]"
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

  const avatarUrls = new Map(orgPrs.map((pr) => [pr.author, pr.authorAvatarUrl]));
  const avatarOf = (item: Extract<Item, { kind: "value" }>) => {
    if (item.property.key !== "author") return null;
    const login = item.option.value === VIEWER_VALUE ? viewer : item.option.value;
    return (
      <UserAvatar
        login={login}
        avatarUrl={avatarUrls.get(login) ?? ""}
        className="sm:[--avatar-size:--spacing(4)]"
      />
    );
  };

  const needle = query.trim().toLowerCase();
  const matches = (label: string) => label.toLowerCase().includes(needle);

  const valueItems = (property: Property, prefixed: boolean): Item[] => {
    const others = filters.filter((filter) => filter.key !== property.key);
    const selected = filters.find((filter) => filter.key === property.key)?.values ?? [];
    const candidates = scopedPrs.filter((pr) => passes(pr, others, viewer));
    return property
      .options(orgPrs, viewer)
      .filter((option) => matches(option.label))
      .map((option) => ({
        kind: "value",
        property,
        option,
        prefixed,
        checked: selected.includes(option.value),
        count: candidates.filter((pr) => property.valueOf(pr, viewer) === option.value).length,
      }));
  };

  const items: Item[] = propertyKey
    ? valueItems(PROPERTY[propertyKey], false)
    : [
        ...PROPERTIES.filter((property) => matches(property.name)).map((property): Item => ({
          kind: "property",
          property,
        })),
        ...(needle ? PROPERTIES.flatMap((property) => valueItems(property, true)) : []),
      ];

  const pick = (item: Item) => {
    if (item.kind === "value") return onToggle(item.property.key, item.option.value);
    setPropertyKey(item.property.key);
    setQuery("");
  };

  return (
    <div className="flex max-h-[min(calc(var(--available-height)-2px),24rem)] flex-col *:first:border-b">
      <Command
        key={propertyKey}
        items={items}
        mode="none"
        value={query}
        onValueChange={(value, { reason }) => reason !== "item-press" && setQuery(value)}
      >
        <CommandInput
          placeholder={propertyKey ? `${PROPERTY[propertyKey].name}…` : "Filter…"}
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !query && propertyKey && canGoBack)
              setPropertyKey(null);
          }}
        />
        <CommandEmpty>No matches</CommandEmpty>
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
          <CommandList>
            {(item: Item) => (
              <CommandItem
                key={itemKey(item)}
                value={item}
                className="gap-2"
                onClick={() => pick(item)}
              >
                {item.kind === "value" ? (
                  <>
                    <Checkbox checked={item.checked} tabIndex={-1} aria-hidden />
                    {avatarOf(item)}
                    {item.prefixed && (
                      <span className="shrink-0 text-muted-foreground">{item.property.name}</span>
                    )}
                    <span className="truncate">{item.option.label}</span>
                    <span className="ms-auto text-muted-foreground text-sm tabular-nums sm:text-xs">
                      {item.count}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{item.property.name}</span>
                    <ChevronRightIcon className="ms-auto size-4 text-muted-foreground sm:size-3.5" />
                  </>
                )}
              </CommandItem>
            )}
          </CommandList>
        </div>
      </Command>
    </div>
  );
}
