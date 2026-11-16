import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { LogOutIcon, RefreshCwIcon } from "lucide-react";
import type { RefObject } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
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
  onSignOut,
}: AppShellProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fetching = useIsFetching() > 0;

  return (
    <header className="flex h-[50px] shrink-0 items-center gap-3 border-b px-4">
      <Tabs
        className="min-w-0 overflow-x-auto"
        value={activeOwner}
        onValueChange={(owner) => navigate(`/${owner}`)}
      >
        <TabsList>
          {enabledOwners.map((owner) => (
            <TabsTab key={owner.login} value={owner.login}>
              <AccountAvatar account={owner} className="size-4.5 rounded-sm" />
              {owner.login}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
      <span className="grow" />
      <Input
        ref={searchRef}
        type="search"
        className="w-70 shrink-0"
        placeholder="Search title, repo, author"
        aria-label="Search pull requests"
        autoComplete="off"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh"
              onClick={() => queryClient.refetchQueries({ type: "active" })}
            />
          }
        >
          <RefreshCwIcon className={cn(fetching && "animate-spin")} />
        </TooltipTrigger>
        <TooltipPopup>Refresh</TooltipPopup>
      </Tooltip>
      <Menu>
        <MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Account" />}>
          <AccountAvatar account={session.viewer} className="size-5.5" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuGroup>
            <MenuGroupLabel>{session.viewer.login}</MenuGroupLabel>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup>
            <MenuGroupLabel>Organisations</MenuGroupLabel>
            {session.owners.map((owner) => {
              const enabled = !hiddenOwners.includes(owner.login);
              return (
                <MenuCheckboxItem
                  key={owner.login}
                  checked={enabled}
                  disabled={enabled && enabledOwners.length === 1}
                  onCheckedChange={(checked) =>
                    onHiddenOwnersChange(
                      checked
                        ? hiddenOwners.filter((login) => login !== owner.login)
                        : [...hiddenOwners, owner.login],
                    )
                  }
                >
                  <span className="flex items-center gap-2">
                    <AccountAvatar account={owner} className="size-4 rounded-sm" />
                    {owner.login}
                  </span>
                </MenuCheckboxItem>
              );
            })}
          </MenuGroup>
          <MenuSeparator />
          <MenuItem onClick={onSignOut}>
            <LogOutIcon />
            Remove token
          </MenuItem>
        </MenuPopup>
      </Menu>
    </header>
  );
}

function AccountAvatar({ account, className }: { account: Account; className: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={account.avatarUrl} alt="" />
      <AvatarFallback>{account.login[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
