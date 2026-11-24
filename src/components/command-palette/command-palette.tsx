import { Fragment } from "react";
import type { ReactNode } from "react";

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

import { PaletteFooter } from "./footer";

export interface PaletteCommand {
  id: string;
  label: ReactNode;
  keywords: string;
  icon: ReactNode;
  end?: ReactNode;
  keepOpen?: boolean;
  run: () => void;
}

export interface Section {
  value: string;
  items: PaletteCommand[];
}

function matches(text: string, needle: string) {
  const haystack = text.toLowerCase();

  return needle.split(/\s+/u).every((word) => haystack.includes(word));
}

interface CommandPaletteListProps {
  sections: Section[];
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

export function CommandPaletteList({
  sections,
  query,
  onQueryChange,
  onClose,
}: CommandPaletteListProps) {
  const needle = query.trim().toLowerCase();

  const matching = sections.flatMap((section) => {
    const items = needle
      ? section.items.filter((item) =>
          matches(`${section.value} ${item.keywords}`, needle)
        )
      : section.items;

    return items.length > 0 ? [{ ...section, items }] : [];
  });

  function run(item: PaletteCommand) {
    item.run();

    if (item.keepOpen !== true) {
      onClose();
    }
  }

  return (
    <Command
      items={matching}
      mode="none"
      value={query}
      onValueChange={(value, { reason }) => {
        if (reason !== "item-press") {
          onQueryChange(value);
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

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function CommandPalette({
  open,
  onOpenChange,
  children,
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogPopup finalFocus={false}>{children}</CommandDialogPopup>
    </CommandDialog>
  );
}
