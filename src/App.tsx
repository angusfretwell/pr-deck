import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, Route, Switch } from "wouter";
import { AppShell } from "@/components/AppShell";
import { OrgRoute } from "@/components/OrgPage";
import { SetupScreen } from "@/components/SetupScreen";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage, isAuthError } from "@/github/api";
import { useSession } from "@/github/hooks";
import { useLastPath, useToken } from "@/lib/storage";
import type { Session } from "@/types";

export default function App() {
  const queryClient = useQueryClient();
  const [token, setToken, removeToken] = useToken();
  const [authError, setAuthError] = useState<string | null>(null);

  const signOut = useCallback(
    (message: string | null) => {
      setAuthError(message);
      removeToken();
      queryClient.clear();
    },
    [queryClient, removeToken],
  );

  const signIn = (newToken: string, session: Session) => {
    queryClient.clear();
    queryClient.setQueryData(["session"], session);
    setAuthError(null);
    setToken(newToken);
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
    <div className="flex h-dvh flex-col bg-background text-[13px] text-foreground">
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
          <EmptyTitle className="text-base">Couldn't reach GitHub</EmptyTitle>
          <EmptyDescription>{errorMessage(session.error)}</EmptyDescription>
        </EmptyHeader>
        <Button size="sm" variant="outline" onClick={() => session.refetch()}>
          Try again
        </Button>
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
  const owners = session.owners.map((owner) => owner.login);

  return (
    <Switch>
      <Route path="/:org/:viewSlug?">
        {({ org, viewSlug }) =>
          owners.includes(org) ? (
            <>
              <AppShell
                session={session}
                activeOwner={org}
                query={query}
                onQueryChange={setQuery}
                searchRef={searchRef}
                onSignOut={onSignOut}
              />
              <OrgRoute
                key={org}
                owner={org}
                viewSlug={viewSlug ?? null}
                viewer={session.viewer.login}
                query={query}
                onQueryChange={setQuery}
                searchRef={searchRef}
              />
            </>
          ) : (
            <Redirect to="/" replace />
          )
        }
      </Route>
      <Route>
        <RootRedirect owners={owners} />
      </Route>
    </Switch>
  );
}

function RootRedirect({ owners }: { owners: string[] }) {
  const [lastPath] = useLastPath();
  const lastOwner = lastPath?.split("/")[1];
  const to = lastPath && lastOwner && owners.includes(lastOwner) ? lastPath : `/${owners[0]}`;
  return <Redirect to={to} replace />;
}
