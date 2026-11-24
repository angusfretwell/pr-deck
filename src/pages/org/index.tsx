import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";

import { useViews } from "@/features/views/hooks/use-views";
import { usePreferences } from "@/lib/preferences";
import { closeOverlays } from "@/pages/org/lib/overlays-store";
import type { Account } from "@/types";

import { ListHotkeys } from "./list-hotkeys";
import { ListPane } from "./list-pane";
import { OrgCommandPalette } from "./org-command-palette";
import { OrgListProvider } from "./org-list-context";
import { OrgViewHeader } from "./org-view-header";
import { PinnedViewHeader, PinnedViewHeaderFrame } from "./pinned-view-header";

interface OrgRouteProps {
  owner: string;
  owners: Account[];
  viewSlug: string | null;
  viewer: string;
}

function CloseOverlaysOnLeave() {
  useEffect(() => closeOverlays, []);

  return null;
}

function RememberLastPath() {
  const [location] = useLocation();

  useEffect(() => {
    usePreferences.setState({ lastPath: location });
  }, [location]);

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
      <PinnedViewHeaderFrame>
        <PinnedViewHeader>
          <OrgViewHeader />
        </PinnedViewHeader>
        <ListPane />
        <OrgCommandPalette />
      </PinnedViewHeaderFrame>
      <CloseOverlaysOnLeave key={views.active?.id} />
      <RememberLastPath />
      <ListHotkeys />
    </OrgListProvider>
  );
}
