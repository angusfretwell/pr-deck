import { SearchIcon } from "@primer/octicons-react";

import { useSearch } from "@/components/search-context";
import { CommandShortcut } from "@/components/ui/command";

import type { PaletteCommand } from "./types";

export function useSearchCommands(query: string) {
  const {
    actions: { setQuery, open },
  } = useSearch();

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
        setQuery(query.trim());
        open();
      },
    },
  ] satisfies PaletteCommand[];
}
