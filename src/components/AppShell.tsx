import { useIsFetching } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import type { RefObject } from "react";
import { useLocation } from "wouter";
import { AccountAvatar } from "@/components/account-avatar";
import { OwnerSwitcher } from "@/components/OwnerSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { Spinner } from "@/components/ui/spinner";
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
  const fetching = useIsFetching() > 0;
  const personal = session.owners.filter((owner) => owner.login === session.viewer.login);
  const organisations = session.owners.filter((owner) => owner.login !== session.viewer.login);

  return (
    <div className="h-[50px] shrink-0">
      <header className="flex h-[50px] items-center gap-3 border-b bg-background px-4 max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-20">
        <OwnerSwitcher
          owners={enabledOwners}
          viewerLogin={session.viewer.login}
          activeOwner={activeOwner}
          onSelect={(owner) => navigate(`/${owner}`)}
        />
        {searchVisible ? (
          <Input
            ref={searchRef}
            type="search"
            className="w-70 min-w-36 shrink"
            placeholder="Search title, repo, author"
            aria-label="Search pull requests"
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onBlur={onSearchBlur}
          />
        ) : (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center sm:size-7">
              {fetching && <Spinner className="size-4.5 opacity-80 sm:size-4" />}
            </span>
            <Menu>
              <MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Account" />}>
                <AccountAvatar account={session.viewer} className="size-5.5" />
              </MenuTrigger>
              <MenuPopup align="end" className="w-64">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <AccountAvatar account={session.viewer} className="size-6" />
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate font-medium">
                      {session.viewer.name || session.viewer.login}
                    </span>
                    {session.viewer.name && (
                      <span className="truncate text-muted-foreground text-xs">
                        {session.viewer.login}
                      </span>
                    )}
                  </div>
                </div>
                <MenuSeparator />
                <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                  {[
                    { label: "Personal account", accounts: personal },
                    { label: "Organisations", accounts: organisations },
                  ].map(
                    ({ label, accounts }) =>
                      accounts.length > 0 && (
                        <MenuGroup key={label}>
                          <MenuGroupLabel>{label}</MenuGroupLabel>
                          {accounts.map((owner) => {
                            const enabled = !hiddenOwners.includes(owner.login);
                            return (
                              <MenuCheckboxItem
                                key={owner.login}
                                checked={enabled}
                                className="grid-cols-[.75rem_minmax(0,1fr)]"
                                disabled={enabled && enabledOwners.length === 1}
                                onCheckedChange={(checked) =>
                                  onHiddenOwnersChange(
                                    checked
                                      ? hiddenOwners.filter((login) => login !== owner.login)
                                      : [...hiddenOwners, owner.login],
                                  )
                                }
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <AccountAvatar
                                    account={owner}
                                    className="size-4 shrink-0 rounded-sm"
                                  />
                                  <span className="truncate" title={owner.login}>
                                    {owner.login}
                                  </span>
                                </span>
                              </MenuCheckboxItem>
                            );
                          })}
                        </MenuGroup>
                      ),
                  )}
                </div>
                <MenuSeparator />
                <MenuItem onClick={onSignOut}>
                  <LogOutIcon />
                  Remove token
                </MenuItem>
              </MenuPopup>
            </Menu>
          </>
        )}
      </header>
    </div>
  );
}
