import { SearchIcon, XIcon } from "@primer/octicons-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  closeSearch,
  dismissSearch,
  openSearch,
  searchInputRef,
  setSearchQuery,
  useSearch,
} from "@/features/search/lib/search-store";

export function HeaderSearch() {
  const query = useSearch((state) => state.query);

  return (
    <InputGroup className="min-w-36 shrink md:w-70">
      <InputGroupInput
        ref={searchInputRef}
        type="search"
        placeholder="Search title, repo, author"
        aria-label="Search pull requests"
        autoComplete="off"
        autoFocus
        value={query}
        onChange={(event) => {
          setSearchQuery(event.target.value);
        }}
        onBlur={closeSearch}
      />
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close search"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={dismissSearch}
        >
          <XIcon aria-hidden />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function SearchButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="md:hidden"
      aria-label="Search pull requests"
      onClick={openSearch}
    >
      <SearchIcon />
    </Button>
  );
}
