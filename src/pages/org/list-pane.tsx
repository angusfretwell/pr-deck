import { InfoIcon } from "@primer/octicons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Preview, PreviewDrawer } from "@/features/preview/preview";
import { cn } from "@/lib/utils";
import type { PullRequestList } from "@/types";

import { LoadErrorOrLoading, NoPullRequests } from "./list-states";
import { useOrgList } from "./org-list-context";
import { usePinnedViewHeaderBottom } from "./pinned-view-header";
import { useSwipeNeighbours, ViewList } from "./view-list";
import { ViewSwipe } from "./view-swipe";

function TruncationNote({ list }: { list: PullRequestList }) {
  if (list.totalCount <= list.pullRequests.length) {
    return null;
  }

  return (
    <div className="px-2 pt-3 md:px-4">
      <Alert variant="info">
        <InfoIcon />
        <AlertDescription>
          Showing the {list.pullRequests.length} most recently updated of{" "}
          {list.totalCount} open pull requests.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ListPreview() {
  const {
    state: { list, selection },
    actions: { act },
    meta: { desktop, viewer },
  } = useOrgList();

  function close() {
    act({ type: "closePreview" });
  }

  if (!desktop) {
    return (
      <PreviewDrawer
        pr={list.selected}
        open={selection.previewOpen}
        viewer={viewer}
        onClose={close}
      />
    );
  }

  if (list.previewed === undefined) {
    return null;
  }

  return <Preview pr={list.previewed} viewer={viewer} onClose={close} />;
}

export function ListPane() {
  const {
    state: { pullRequests, list, allPrs },
    meta: { owner },
  } = useOrgList();

  const { previous, next } = useSwipeNeighbours();
  const headerBottom = usePinnedViewHeaderBottom();

  if (!pullRequests.data) {
    return <LoadErrorOrLoading result={pullRequests} />;
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col max-md:overflow-x-clip md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)] md:overflow-hidden",
        list.previewed &&
          "md:grid-cols-[minmax(0,1fr)_minmax(380px,min(46%,800px))]"
      )}
    >
      <ViewSwipe
        previous={previous}
        next={next}
        topInset={headerBottom}
        className="flex flex-1 flex-col pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] md:min-h-0 md:overflow-y-auto md:overscroll-contain"
      >
        {allPrs.length === 0 ? (
          <NoPullRequests owner={owner} result={pullRequests} />
        ) : (
          <ViewList list={list} selectedId={list.highlightedId} />
        )}
        <TruncationNote list={pullRequests.data} />
      </ViewSwipe>
      <ListPreview />
    </div>
  );
}
