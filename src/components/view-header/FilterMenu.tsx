import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverPopup } from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { type Option, passes, PROPERTIES, PROPERTY, type Property } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Filter, PropertyKey, PullRequest } from "@/types";
import type { FilterMenuState, MenuAnchor } from "../ViewHeader";

export const FILTER_TRIGGER = "data-filter-trigger";

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

interface FilterMenuProps {
  menu: FilterMenuState | null;
  anchorOf: (anchor: MenuAnchor) => Element | null;
  onClose: () => void;
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  filters: Filter[];
  viewer: string;
  onToggle: (key: PropertyKey, value: string) => void;
}

function fromTrigger(event: Event) {
  const target = event instanceof FocusEvent ? event.relatedTarget : event.target;
  return target instanceof Element && target.closest(`[${FILTER_TRIGGER}]`) !== null;
}

export function FilterMenu({ menu, anchorOf, onClose, ...list }: FilterMenuProps) {
  return (
    <Popover
      open={menu !== null}
      onOpenChange={(open, { event }) => !open && !fromTrigger(event) && onClose()}
    >
      {menu && (
        <PopoverPopup
          key={menu.anchor}
          anchor={() => anchorOf(menu.anchor)}
          align={menu.anchor === "header" ? "end" : "start"}
          portalProps={{ className: "*:transition-none" }}
          className="w-62.5 *:data-[slot=popover-viewport]:p-1"
        >
          <FilterMenuList
            initialKey={menu.propertyKey}
            canGoBack={typeof menu.anchor !== "number"}
            {...list}
          />
        </PopoverPopup>
      )}
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
  const [highlight, setHighlight] = useState(0);

  const avatarUrls = new Map(orgPrs.map((pr) => [pr.author, pr.authorAvatarUrl]));
  const avatarOf = (item: Extract<Item, { kind: "value" }>) => {
    if (item.property.key !== "author") return null;
    const login = item.option.value === "@me" ? viewer : item.option.value;
    return (
      <UserAvatar
        login={login}
        avatarUrl={avatarUrls.get(login) ?? ""}
        className="[--avatar-size:--spacing(4)]"
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
  const active = Math.min(highlight, items.length - 1);

  const pick = (item: Item) => {
    if (item.kind === "value") return onToggle(item.property.key, item.option.value);
    setPropertyKey(item.property.key);
    setQuery("");
    setHighlight(0);
  };

  return (
    <div className="flex flex-col text-[13px]">
      <input
        className="mb-1 h-7.5 w-full border-b bg-transparent px-2 text-foreground outline-none placeholder:text-muted-foreground/72"
        placeholder={propertyKey ? `${PROPERTY[propertyKey].name}…` : "Filter…"}
        value={query}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            if (items.length) setHighlight((active + step + items.length) % items.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (items[active]) pick(items[active]);
          } else if (event.key === "Backspace" && !query && propertyKey && canGoBack) {
            setPropertyKey(null);
            setHighlight(0);
          }
        }}
      />
      {items.length === 0 && <div className="px-2 py-2.5 text-muted-foreground">No matches</div>}
      {items.map((item, index) => (
        <div
          key={
            item.kind === "value" ? `${item.property.key}:${item.option.value}` : item.property.key
          }
          className={cn(
            "flex h-7 shrink-0 cursor-default select-none items-center gap-2 rounded-sm px-2 text-foreground",
            index === active && "bg-accent text-accent-foreground",
          )}
          onPointerMove={() => setHighlight(index)}
          onMouseDown={(event) => event.preventDefault()}
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
              <span className="ms-auto text-[11px] text-muted-foreground tabular-nums">
                {item.count}
              </span>
            </>
          ) : (
            <>
              <span className="truncate">{item.property.name}</span>
              <ChevronRightIcon className="ms-auto size-3.5 text-muted-foreground" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
