import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  CheckIcon,
  FilterIcon,
  FilterRemoveIcon,
  FoldIcon,
  GitPullRequestDraftIcon,
  PaintbrushIcon,
  PlusIcon,
  RowsIcon,
  SearchIcon,
  SyncIcon,
  UnfoldIcon,
} from "@primer/octicons-react";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

import { AccountAvatar } from "@/components/account-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { facets, PROPERTIES, toggleValue } from "@/lib/filters";
import { GROUPS } from "@/lib/pr-list";
import { resetQueryCache } from "@/lib/query-cache";
import { THEMES, useColorMode } from "@/lib/storage";
import { ALL_OPEN_NAME } from "@/lib/views";
import type { Views, ViewsChange } from "@/lib/views";
import type { Account, Group, PullRequest } from "@/types";

interface PaletteCommand {
  id: string;
  label: ReactNode;
  keywords: string;
  icon: ReactNode;
  end?: ReactNode;
  keepOpen?: boolean;
  run: () => void;
}

interface Section {
  value: string;
  items: PaletteCommand[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  owners: Account[];
  views: Views;
  onViewsChange: (change: ViewsChange) => void;
  viewCounts: Record<string, number>;
  allOpenCount: number | undefined;
  orgPrs: PullRequest[];
  scopedPrs: PullRequest[];
  viewer: string;
  group: Group;
  onGroupChange: (group: Group) => void;
  allGroupsCollapsed: boolean;
  onToggleAllGroups?: () => void;
  hideDrafts: boolean;
  onHideDraftsChange?: (hideDrafts: boolean) => void;
  onSearch: (query: string) => void;
}

function Check() {
  return <CheckIcon className="text-muted-foreground size-3.5" />;
}

function Count({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {children}
    </span>
  );
}

function sentenceCase(name: string) {
  return name === "CI" ? name : name.toLowerCase();
}

function matches(text: string, needle: string) {
  const haystack = text.toLowerCase();

  return needle.split(/\s+/u).every((word) => haystack.includes(word));
}

function CommandPaletteList({
  onClose,
  owner,
  owners,
  views,
  onViewsChange,
  viewCounts,
  allOpenCount,
  orgPrs,
  scopedPrs,
  viewer,
  group,
  onGroupChange,
  allGroupsCollapsed,
  onToggleAllGroups,
  hideDrafts,
  onHideDraftsChange,
  onSearch,
}: Omit<CommandPaletteProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const { ternaryDarkMode, setTernaryDarkMode } = useColorMode();
  const needle = query.trim().toLowerCase();
  const { filters } = views;
  const activeViewId = views.active?.id ?? null;

  function setFilters(next: typeof filters) {
    onViewsChange(views.setFilters(next));
  }

  const viewItems: PaletteCommand[] = [
    { id: null, name: ALL_OPEN_NAME, count: allOpenCount },
    ...views.list.map((view) => ({
      id: view.id,
      name: view.name,
      count: viewCounts[view.id],
    })),
  ].map((view) => ({
    id: `view:${view.id}`,
    keywords: `go to view ${view.name}`,
    icon: <BookmarkIcon />,
    label: view.name,
    end: activeViewId === view.id ? <Check /> : <Count>{view.count}</Count>,
    run: () => {
      navigate(views.hrefFor(view.id));
    },
  }));

  const filterActions: PaletteCommand[] = [
    ...(needle
      ? []
      : PROPERTIES.map((property) => ({
          id: `prefill:${property.key}`,
          keywords: `filter by ${property.name}`,
          icon: <FilterIcon />,
          label: `Filter by ${sentenceCase(property.name)}…`,
          keepOpen: true,
          run: () => {
            setQuery(`${property.name} `);
          },
        }))),
    ...(views.filtersChanged
      ? [
          {
            id: "filters:reset",
            keywords: "clear filters remove reset",
            icon: <FilterRemoveIcon />,
            label: views.active ? "Reset filters" : "Clear filters",
            run: () => {
              onViewsChange(views.resetFilters());
            },
          },
          ...(views.active
            ? [
                {
                  id: "view:save",
                  keywords: "save view",
                  icon: <CheckIcon />,
                  label: `Save changes to ${views.active.name}`,
                  run: () => {
                    onViewsChange(views.save());
                  },
                },
              ]
            : []),
          {
            id: "view:new",
            keywords: "save as new view",
            icon: <PlusIcon />,
            label: "Save as new view",
            run: () => {
              onViewsChange(views.saveAsNew());
            },
          },
        ]
      : []),
  ];

  const filterValues: PaletteCommand[] = needle
    ? PROPERTIES.flatMap((property) =>
        facets(property, filters, scopedPrs, orgPrs, viewer).map((facet) => ({
          id: `value:${property.key}:${facet.option.value}`,
          keywords: `filter ${property.name} ${facet.option.label}`,
          icon: <Checkbox checked={facet.checked} tabIndex={-1} aria-hidden />,
          label: (
            <span className="flex min-w-0 gap-1.5">
              <span className="text-muted-foreground shrink-0">
                {property.name}
              </span>
              <span className="truncate">{facet.option.label}</span>
            </span>
          ),
          end: <Count>{facet.count}</Count>,
          run: () => {
            setFilters(toggleValue(filters, property.key, facet.option.value));
          },
        }))
      )
    : [];

  const displayItems: PaletteCommand[] = [
    ...GROUPS.map(({ value, label }) => ({
      id: `group:${value}`,
      keywords: `group by ${label}`,
      icon: <RowsIcon />,
      label:
        value === "none" ? "Don't group" : `Group by ${label.toLowerCase()}`,
      end: group === value ? <Check /> : undefined,
      run: () => {
        onGroupChange(value);
      },
    })),
    ...(onToggleAllGroups
      ? [
          {
            id: "groups:toggle-all",
            keywords: "expand collapse fold unfold all groups",
            icon: allGroupsCollapsed ? <UnfoldIcon /> : <FoldIcon />,
            label: allGroupsCollapsed
              ? "Expand all groups"
              : "Collapse all groups",
            run: onToggleAllGroups,
          },
        ]
      : []),
    ...(onHideDraftsChange
      ? [
          {
            id: "drafts",
            keywords: "drafts hide show toggle",
            icon: <GitPullRequestDraftIcon />,
            label: hideDrafts ? "Show drafts" : "Hide drafts",
            end: <CommandShortcut>D</CommandShortcut>,
            run: () => {
              onHideDraftsChange(!hideDrafts);
            },
          },
        ]
      : []),
    ...THEMES.map(({ value, label }) => ({
      id: `theme:${value}`,
      keywords: `theme appearance ${label} mode`,
      icon: <PaintbrushIcon />,
      label: `${label} theme`,
      end: ternaryDarkMode === value ? <Check /> : undefined,
      run: () => {
        setTernaryDarkMode(value);
      },
    })),
  ];

  const accountItems: PaletteCommand[] = owners.map((account) => ({
    id: `owner:${account.login}`,
    keywords: `switch account organisation ${account.login} ${account.name}`,
    icon: <AccountAvatar account={account} className="size-4 rounded-sm" />,
    label: `Switch to ${account.login}`,
    end: account.login === owner ? <Check /> : undefined,
    run: () => {
      navigate(`/${account.login}`);
    },
  }));

  const sections: Section[] = [
    { value: "Views", items: viewItems },
    { value: "Filters", items: [...filterActions, ...filterValues] },
    { value: "Display", items: displayItems },
    { value: "Accounts", items: accountItems },
    {
      value: "App",
      items: [
        {
          id: "cache:clear",
          keywords: "clear cache reload refresh refetch data",
          icon: <SyncIcon />,
          label: "Clear cache",
          run: resetQueryCache,
        },
      ],
    },
  ].flatMap((section) => {
    const items = needle
      ? section.items.filter((item) =>
          matches(`${section.value} ${item.keywords}`, needle)
        )
      : section.items;

    return items.length > 0 ? [{ ...section, items }] : [];
  });

  if (needle) {
    sections.push({
      value: "Search",
      items: [
        {
          id: "search",
          keywords: query,
          icon: <SearchIcon />,
          label: (
            <span className="truncate">
              Search pull requests for{" "}
              <span className="font-medium">“{query.trim()}”</span>
            </span>
          ),
          end: <CommandShortcut>/</CommandShortcut>,
          run: () => {
            onSearch(query.trim());
          },
        },
      ],
    });
  }

  function run(item: PaletteCommand) {
    item.run();

    if (item.keepOpen !== true) {
      onClose();
    }
  }

  return (
    <Command
      items={sections}
      mode="none"
      value={query}
      onValueChange={(value, { reason }) => {
        if (reason !== "item-press") {
          setQuery(value);
        }
      }}
    >
      <CommandInput
        placeholder="Type a command or search…"
        spellCheck={false}
      />
      <CommandPanel>
        <CommandList>
          {(section: Section) => (
            <Fragment key={section.value}>
              <CommandGroup items={section.items}>
                <CommandGroupLabel>{section.value}</CommandGroupLabel>
                <CommandCollection>
                  {(item: PaletteCommand) => (
                    <CommandItem
                      key={item.id}
                      value={item}
                      className="*:[svg]:text-muted-foreground gap-2.5 *:[svg]:size-4 *:[svg]:shrink-0"
                      onClick={() => {
                        run(item);
                      }}
                    >
                      {item.icon}
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.end}
                    </CommandItem>
                  )}
                </CommandCollection>
              </CommandGroup>
              <CommandSeparator />
            </Fragment>
          )}
        </CommandList>
      </CommandPanel>
      <CommandFooter>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <KbdGroup>
              <Kbd>
                <ArrowUpIcon />
              </Kbd>
              <Kbd>
                <ArrowDownIcon />
              </Kbd>
            </KbdGroup>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>↵</Kbd>
            <span>Run</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Kbd>Esc</Kbd>
          <span>Close</span>
        </div>
      </CommandFooter>
    </Command>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  ...props
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogPopup finalFocus={false}>
        <CommandPaletteList
          onClose={() => {
            onOpenChange(false);
          }}
          {...props}
        />
      </CommandDialogPopup>
    </CommandDialog>
  );
}
