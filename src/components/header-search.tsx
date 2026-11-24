import { SearchIcon, XIcon } from "@primer/octicons-react";

import { useSearch } from "@/components/search-context";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function HeaderSearch() {
  const {
    state: { query },
    actions: { setQuery, close, dismiss },
    meta: { inputRef },
  } = useSearch();

  return (
    <InputGroup className="min-w-36 shrink md:w-70">
      <InputGroupInput
        ref={inputRef}
        type="search"
        placeholder="Search title, repo, author"
        aria-label="Search pull requests"
        autoComplete="off"
        autoFocus
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onBlur={close}
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
          onClick={dismiss}
        >
          <XIcon aria-hidden />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function SearchButton() {
  const {
    actions: { open },
  } = useSearch();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="md:hidden"
      aria-label="Search pull requests"
      onClick={open}
    >
      <SearchIcon />
    </Button>
  );
}
