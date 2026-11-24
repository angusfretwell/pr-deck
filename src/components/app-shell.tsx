import { useIsFetching } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { AccountMenu } from "@/components/account-menu";
import { HeaderSearch, SearchButton } from "@/components/header-search";
import { OwnerSwitcher } from "@/components/owner-switcher";
import { useSearch } from "@/components/search-context";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Account, Session } from "@/types";

interface AppShellProps {
  session: Session;
  enabledOwners: Account[];
  hiddenOwners: string[];
  onHiddenOwnersChange: (hiddenOwners: string[]) => void;
  activeOwner: string;
  onSignOut: () => void;
}

function FetchingIndicator() {
  const fetching = useIsFetching() > 0;

  return (
    <span className="flex size-8 shrink-0 items-center justify-center sm:size-7">
      {fetching && (
        <Spinner className="text-muted-foreground ease-snappy size-4.5 transition-opacity delay-300 duration-200 sm:size-4 starting:opacity-0" />
      )}
    </span>
  );
}

export function AppShell({
  session,
  enabledOwners,
  hiddenOwners,
  onHiddenOwnersChange,
  activeOwner,
  onSignOut,
}: AppShellProps) {
  const [, navigate] = useLocation();

  const {
    state: { visible: searching },
  } = useSearch();

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
          <HeaderSearch />
        ) : (
          <>
            <FetchingIndicator />
            <SearchButton />
            <AccountMenu
              session={session}
              enabledOwners={enabledOwners}
              hiddenOwners={hiddenOwners}
              onHiddenOwnersChange={onHiddenOwnersChange}
              onSignOut={onSignOut}
            />
          </>
        )}
      </header>
    </div>
  );
}
