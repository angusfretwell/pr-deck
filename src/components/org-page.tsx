import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";

import { CommandPalette } from "@/components/command-palette";
import { ListHotkeys } from "@/components/org/list-hotkeys";
import { ListPane } from "@/components/org/list-pane";
import { OrgListProvider } from "@/components/org/org-list-context";
import { OrgOverlaysProvider } from "@/components/org/org-overlays-context";
import { OrgViewHeader } from "@/components/org/org-view-header";
import {
  PinnedViewHeader,
  PinnedViewHeaderFrame,
} from "@/components/org/pinned-view-header";
import { useLastPath } from "@/lib/storage";
import { useViews } from "@/lib/use-views";
import type { Account } from "@/types";

interface OrgRouteProps {
  owner: string;
  owners: Account[];
  viewSlug: string | null;
  viewer: string;
}

function RememberLastPath() {
  const [location] = useLocation();
  const [, setLastPath] = useLastPath();

  useEffect(() => {
    setLastPath(location);
  }, [location, setLastPath]);

  return null;
}

export function OrgRoute({ owner, owners, viewSlug, viewer }: OrgRouteProps) {
  const state = useViews(owner, viewSlug);

  if (!state) {
    return null;
  }

  const { views, commit } = state;

  if (views.redirectTo !== null) {
    return <Redirect to={views.redirectTo} replace />;
  }

  return (
    <OrgListProvider
      owner={owner}
      owners={owners}
      viewer={viewer}
      views={views}
      commit={commit}
    >
      <OrgOverlaysProvider
        viewId={views.active?.id ?? null}
        filtersChanged={views.filtersChanged}
      >
        <PinnedViewHeaderFrame>
          <PinnedViewHeader>
            <OrgViewHeader />
          </PinnedViewHeader>
          <ListPane />
          <CommandPalette />
        </PinnedViewHeaderFrame>
        <RememberLastPath />
        <ListHotkeys />
      </OrgOverlaysProvider>
    </OrgListProvider>
  );
}
