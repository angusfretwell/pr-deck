import { Fragment, useState } from "react";

import { APP_COMMANDS } from "@/components/command-palette/app-commands";
import { PaletteFooter } from "@/components/command-palette/footer";
import type {
  PaletteCommand,
  Section,
} from "@/components/command-palette/types";
import { useAccountCommands } from "@/components/command-palette/use-account-commands";
import { useDisplayCommands } from "@/components/command-palette/use-display-commands";
import { useFilterCommands } from "@/components/command-palette/use-filter-commands";
import { useSearchCommands } from "@/components/command-palette/use-search-commands";
import { useViewCommands } from "@/components/command-palette/use-view-commands";
import { useOrgOverlays } from "@/components/org/org-overlays-context";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@/components/ui/command";

function matches(text: string, needle: string) {
  const haystack = text.toLowerCase();

  return needle.split(/\s+/u).every((word) => haystack.includes(word));
}

function CommandPaletteList({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const sections: Section[] = [
    { value: "Views", items: useViewCommands() },
    { value: "Filters", items: useFilterCommands(needle, setQuery) },
    { value: "Display", items: useDisplayCommands() },
    { value: "Accounts", items: useAccountCommands() },
    { value: "App", items: APP_COMMANDS },
  ].flatMap((section) => {
    const items = needle
      ? section.items.filter((item) =>
          matches(`${section.value} ${item.keywords}`, needle)
        )
      : section.items;

    return items.length > 0 ? [{ ...section, items }] : [];
  });

  const searchItems = useSearchCommands(query);

  if (needle) {
    sections.push({ value: "Search", items: searchItems });
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
      <PaletteFooter />
    </Command>
  );
}

export function CommandPalette() {
  const {
    state: { paletteOpen },
    actions: { setPaletteOpen },
  } = useOrgOverlays();

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandDialogPopup finalFocus={false}>
        <CommandPaletteList
          onClose={() => {
            setPaletteOpen(false);
          }}
        />
      </CommandDialogPopup>
    </CommandDialog>
  );
}
