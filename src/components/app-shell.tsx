import {
  MarkGithubIcon,
  SearchIcon,
  SignOutIcon,
  XIcon,
} from "@primer/octicons-react";
import { useIsFetching } from "@tanstack/react-query";
import { useState } from "react";
import type { RefObject } from "react";
import { useLocation } from "wouter";

import { AccountAvatar } from "@/components/account-avatar";
import { OwnerSwitcher } from "@/components/owner-switcher";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuGroup,
  ResponsiveMenuGroupLabel,
  ResponsiveMenuItem,
  ResponsiveMenuLinkItem,
  ResponsiveMenuPopup,
  ResponsiveMenuRadioGroup,
  ResponsiveMenuRadioItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/components/responsive-menu";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { REPO_URL } from "@/lib/repo";
import { THEMES, useColorMode } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Account, Session } from "@/types";

interface AppShellProps {
  session: Session;
  enabledOwners: Account[];
  hiddenOwners: string[];
  onHiddenOwnersChange: (hiddenOwners: string[]) => void;
  activeOwner: string;
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  searchVisible: boolean;
  onSearchBlur: () => void;
  onSignOut: () => void;
}

export function AppShell({
  session,
  enabledOwners,
  hiddenOwners,
  onHiddenOwnersChange,
  activeOwner,
  query,
  onQueryChange,
  searchRef,
  searchVisible,
  onSearchBlur,
  onSignOut,
}: AppShellProps) {
  const [, navigate] = useLocation();
  const [searchTapped, setSearchTapped] = useState(false);
  const searching = searchVisible || searchTapped;
  const fetching = useIsFetching() > 0;
  const { ternaryDarkMode, setTernaryDarkMode } = useColorMode();

  const dismissSearch = () => {
    onQueryChange("");
    setSearchTapped(false);
    onSearchBlur();
  };

  return (
    <div className="h-12.5 shrink-0">
      <header className="bg-background flex h-12.5 items-center gap-3 border-b px-2 max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-20 md:px-4">
        <div className={cn("contents", searching && "max-md:hidden")}>
          <OwnerSwitcher
            owners={enabledOwners}
            viewerLogin={session.viewer.login}
            activeOwner={activeOwner}
            onSelect={(owner) => {
              navigate(`/${owner}`);
            }}
          />
        </div>
        {searching ? (
          <InputGroup className="min-w-36 shrink md:w-70">
            <InputGroupInput
              ref={searchRef}
              type="search"
              placeholder="Search title, repo, author"
              aria-label="Search pull requests"
              autoComplete="off"
              autoFocus
              value={query}
              onChange={(event) => {
                onQueryChange(event.target.value);
              }}
              onBlur={() => {
                setSearchTapped(false);
                onSearchBlur();
              }}
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
        ) : (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center sm:size-7">
              {fetching && (
                <Spinner className="text-muted-foreground ease-snappy size-4.5 transition-opacity delay-300 duration-200 sm:size-4 starting:opacity-0" />
              )}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Search pull requests"
              onClick={() => {
                setSearchTapped(true);
              }}
            >
              <SearchIcon />
            </Button>
            <ResponsiveMenu>
              <ResponsiveMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Account" />
                }
              >
                <AccountAvatar account={session.viewer} className="size-5.5" />
              </ResponsiveMenuTrigger>
              <ResponsiveMenuPopup align="end" className="w-64">
                <ResponsiveMenuGroup>
                  <ResponsiveMenuGroupLabel>
                    Organisations
                  </ResponsiveMenuGroupLabel>
                  {session.owners.map((owner) => {
                    const enabled = !hiddenOwners.includes(owner.login);

                    return (
                      <ResponsiveMenuCheckboxItem
                        className="grid-cols-[.75rem_minmax(0,1fr)]"
                        key={owner.login}
                        checked={enabled}
                        disabled={enabled && enabledOwners.length === 1}
                        onCheckedChange={(checked) => {
                          onHiddenOwnersChange(
                            checked
                              ? hiddenOwners.filter(
                                  (login) => login !== owner.login
                                )
                              : [...hiddenOwners, owner.login]
                          );
                        }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <AccountAvatar
                            account={owner}
                            className="size-4 rounded-sm"
                          />
                          <span className="truncate" title={owner.login}>
                            {owner.login}
                          </span>
                        </span>
                      </ResponsiveMenuCheckboxItem>
                    );
                  })}
                </ResponsiveMenuGroup>
                <ResponsiveMenuSeparator />
                <ResponsiveMenuGroup>
                  <ResponsiveMenuGroupLabel>Theme</ResponsiveMenuGroupLabel>
                  <ResponsiveMenuRadioGroup
                    value={ternaryDarkMode}
                    onValueChange={setTernaryDarkMode}
                  >
                    {THEMES.map(({ value, label }) => (
                      <ResponsiveMenuRadioItem key={value} value={value}>
                        {label}
                      </ResponsiveMenuRadioItem>
                    ))}
                  </ResponsiveMenuRadioGroup>
                </ResponsiveMenuGroup>
                <ResponsiveMenuSeparator />
                <ResponsiveMenuLinkItem
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener"
                >
                  <MarkGithubIcon />
                  Source on GitHub
                </ResponsiveMenuLinkItem>
                <ResponsiveMenuSeparator />
                <ResponsiveMenuItem onClick={onSignOut}>
                  <SignOutIcon />
                  Clear token
                </ResponsiveMenuItem>
              </ResponsiveMenuPopup>
            </ResponsiveMenu>
          </>
        )}
      </header>
    </div>
  );
}
