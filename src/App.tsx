import { useQueryClient } from "@tanstack/react-query";
import { CloudOffIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { OrgRoute } from "@/components/OrgPage";
import { SetupScreen } from "@/components/SetupScreen";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage, isAuthError } from "@/github/api";
import { useSession } from "@/github/hooks";
import { clearQueryCache } from "@/lib/query-cache";
import { useHiddenOwners, useLastPath, useToken } from "@/lib/storage";
import type { Session } from "@/types";

export default function App() {
  const queryClient = useQueryClient();
  const [token, setToken, removeToken] = useToken();
  const [authError, setAuthError] = useState<string | null>(null);

  const signOut = useCallback(
    (message: string | null) => {
      setAuthError(message);
      removeToken();
      clearQueryCache();
    },
    [removeToken],
  );

  const signIn = (newToken: string, session: Session) => {
    clearQueryCache();
    setToken(newToken);
    queryClient.setQueryData(["session"], session);
    setAuthError(null);
  };

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          event.action.type === "error" &&
          isAuthError(event.action.error)
        ) {
          signOut(errorMessage(event.action.error));
        }
      }),
    [queryClient, signOut],
  );

  return (
    <div className="flex min-h-dvh flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:h-dvh">
      {token ? (
        <Workspace onSignOut={() => signOut(null)} />
      ) : (
        <SetupScreen initialError={authError} onSignIn={signIn} />
      )}
    </div>
  );
}

function Workspace({ onSignOut }: { onSignOut: () => void }) {
  const session = useSession();
  if (session.data) return <Dashboard session={session.data} onSignOut={onSignOut} />;
  if (session.isError && !isAuthError(session.error)) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CloudOffIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn't reach GitHub</EmptyTitle>
          <EmptyDescription>{errorMessage(session.error)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            size="sm"
            variant="outline"
            loading={session.isFetching}
            onClick={() => session.refetch()}
          >
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="grid flex-1 place-items-center text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  );
}

function Dashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => {
    setSearchOpen(true);
    searchRef.current?.focus();
  };
  const [hiddenOwners, setHiddenOwners] = useHiddenOwners();
  const enabledOwners = session.owners.filter((owner) => !hiddenOwners.includes(owner.login));
  const owners = enabledOwners.map((owner) => owner.login);

  return (
    <Switch>
      <Route path="/:org/:viewSlug?">
        {({ org, viewSlug }) => (
          <>
            <AppShell
              session={session}
              enabledOwners={enabledOwners}
              hiddenOwners={hiddenOwners}
              onHiddenOwnersChange={setHiddenOwners}
              activeOwner={org}
              query={query}
              onQueryChange={setQuery}
              searchRef={searchRef}
              searchVisible={searchOpen || query !== ""}
              onSearchBlur={() => setSearchOpen(false)}
              onSignOut={onSignOut}
            />
            {owners.includes(org) ? (
              <OrgRoute
                key={org}
                owner={org}
                viewSlug={viewSlug ?? null}
                viewer={session.viewer.login}
                query={query}
                onQueryChange={setQuery}
                onOpenSearch={openSearch}
              />
            ) : (
              <OwnerNotFound owner={org} hidden={hiddenOwners.includes(org)} owners={owners} />
            )}
          </>
        )}
      </Route>
      <Route>
        <RootRedirect owners={owners} />
      </Route>
    </Switch>
  );
}

function useFallbackPath(owners: string[]) {
  const [lastPath] = useLastPath();
  const lastOwner = lastPath?.split("/")[1];
  return lastPath && lastOwner && owners.includes(lastOwner) ? lastPath : `/${owners[0]}`;
}

function RootRedirect({ owners }: { owners: string[] }) {
  return <Redirect to={useFallbackPath(owners)} replace />;
}

function OwnerNotFound({
  owner,
  hidden,
  owners,
}: {
  owner: string;
  hidden: boolean;
  owners: string[];
}) {
  const [, navigate] = useLocation();
  const fallbackPath = useFallbackPath(owners);
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{hidden ? `${owner} is hidden` : `No access to ${owner}`}</EmptyTitle>
        <EmptyDescription>
          {hidden
            ? "You hid this account from the account menu. Show it again there to see its pull requests."
            : "It isn't one of your accounts or organisations, or your token can't see it."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(fallbackPath, { replace: true })}
        >
          Back to {fallbackPath.split("/")[1]}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
