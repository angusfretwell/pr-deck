import { useState } from "react";

import {
  CommandPalette,
  CommandPaletteList,
} from "@/components/command-palette/command-palette";
import { useAccountCommands } from "@/pages/org/hooks/use-account-commands";
import { useDisplayCommands } from "@/pages/org/hooks/use-display-commands";
import { useFilterCommands } from "@/pages/org/hooks/use-filter-commands";
import { useSearchCommands } from "@/pages/org/hooks/use-search-commands";
import { useViewCommands } from "@/pages/org/hooks/use-view-commands";
import { APP_COMMANDS } from "@/pages/org/lib/app-commands";
import { setPaletteOpen, useOverlays } from "@/pages/org/lib/overlays-store";

function closePalette() {
  setPaletteOpen(false);
}

function OrgCommandList() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const searchItems = useSearchCommands(query);

  const sections = [
    { value: "Views", items: useViewCommands() },
    { value: "Filters", items: useFilterCommands(needle, setQuery) },
    { value: "Display", items: useDisplayCommands() },
    { value: "Accounts", items: useAccountCommands() },
    { value: "App", items: APP_COMMANDS },
    ...(needle ? [{ value: "Search", items: searchItems }] : []),
  ];

  return (
    <CommandPaletteList
      sections={sections}
      query={query}
      onQueryChange={setQuery}
      onClose={closePalette}
    />
  );
}

export function OrgCommandPalette() {
  const paletteOpen = useOverlays((state) => state.paletteOpen);

  return (
    <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
      <OrgCommandList />
    </CommandPalette>
  );
}
