import { SearchIcon } from "@primer/octicons-react";

import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { CommandShortcut } from "@/components/ui/command";
import { openSearch, setSearchQuery } from "@/features/search/lib/search-store";

export function useSearchCommands(query: string) {
  return [
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
        setSearchQuery(query.trim());
        openSearch();
      },
    },
  ] satisfies PaletteCommand[];
}
