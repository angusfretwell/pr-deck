import { noop } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { PrTable } from "@/components/pr-table";
import { SearchProvider } from "@/components/search-context";
import { FilterButton, ViewHeader } from "@/components/view-header";
import { DisplayMenu } from "@/components/view-header/display-menu";
import { DraftsToggle } from "@/components/view-header/drafts-toggle";
import { ViewTabs } from "@/components/view-header/view-tabs";
import { derivePrList, NO_SELECTION } from "@/lib/pr-list";
import { cn } from "@/lib/utils";
import { countByView, openViews } from "@/lib/views";
import type { Account, PullRequest, Session } from "@/types";

const VIEWER = "sam-k";
const OWNER = "northwind";

function identicon(login: string) {
  return `https://github.com/identicons/${login}.png`;
}

function account(login: string, name: string) {
  return {
    login,
    name,
    avatarUrl: identicon(login),
  } satisfies Account;
}

const SESSION: Session = {
  viewer: account(VIEWER, "Sam Kowalczyk"),
  owners: [
    account(VIEWER, "Sam Kowalczyk"),
    account(OWNER, "Northwind"),
    account("fieldwork-labs", "Fieldwork Labs"),
  ],
};

const VIEWS = openViews({ owner: OWNER, stored: undefined, slug: null }).list;

type Seed = [
  repo: string,
  number: number,
  title: string,
  author: string,
  hoursAgo: number,
  ci: PullRequest["ci"],
  review: PullRequest["review"],
  extra?: Partial<PullRequest>,
];

const SEEDS: Seed[] = [
  [
    "api",
    2841,
    "Add retry budget to webhook dispatcher",
    "priya-n",
    2,
    "pass",
    "approved",
  ],
  [
    "api",
    2836,
    "Cache org membership lookups for five minutes",
    VIEWER,
    6,
    "pending",
    "none",
  ],
  [
    "api",
    2829,
    "Paginate the audit events endpoint",
    "devonte",
    30,
    "fail",
    "changes",
    { reviewRequestedFromViewer: true },
  ],
  [
    "api",
    2817,
    "Return 409 when a seat is already assigned",
    "lena-ortiz",
    160,
    "pass",
    "comment",
    { mergeability: "conflict" },
  ],
  [
    "infra",
    412,
    "Drop Node 18 from the CI matrix",
    "mkato",
    20,
    "pass",
    "approved",
  ],
  [
    "infra",
    409,
    "Move preview deploys to the shared runner pool",
    VIEWER,
    52,
    "pass",
    "none",
    { isDraft: true },
  ],
  [
    "web",
    1193,
    "Migrate billing settings to the new form primitives",
    "lena-ortiz",
    5,
    "fail",
    "none",
    { reviewRequestedFromViewer: true },
  ],
  [
    "web",
    1191,
    "Fix timezone drift in the weekly digest preview",
    "priya-n",
    9,
    "pending",
    "comment",
    { reviewRequestedFromViewer: true },
  ],
  [
    "web",
    1187,
    "Virtualize the audit log table",
    VIEWER,
    44,
    "pass",
    "approved",
  ],
  [
    "web",
    1180,
    "Keyboard shortcuts for the command menu",
    "devonte",
    70,
    "pass",
    "none",
  ],
];

const now = Date.now();

const PULL_REQUESTS: PullRequest[] = SEEDS.map(
  ([repo, number, title, author, hoursAgo, ci, review, extra]) => ({
    id: `${repo}-${number}`,
    owner: OWNER,
    repo,
    number,
    title,
    url: `https://github.com/${OWNER}/${repo}/pull/${number}`,
    author,
    authorAvatarUrl: identicon(author),
    isDraft: false,
    branch: `preview/${number}`,
    baseBranch: "main",
    isCrossRepository: false,
    updatedAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
    ci,
    mergeability: "clean",
    review,
    reviewers: [],
    reviewRequestedFromViewer: false,
    ...extra,
  })
);

const VIEW_COUNTS = countByView(VIEWS, PULL_REQUESTS, VIEWER);

const { groups: GROUPS } = derivePrList({
  pullRequests: PULL_REQUESTS,
  stacks: new Map(),
  query: "",
  filters: [],
  viewer: VIEWER,
  group: "repo",
  collapsed: [],
  starred: [],
  selection: NO_SELECTION,
  desktop: true,
});

export function SetupPreview({ className }: { className?: string }) {
  return (
    <div
      inert
      aria-hidden
      className={cn(
        "bg-background pointer-events-none isolate flex flex-col select-none",
        className
      )}
    >
      <SearchProvider>
        <AppShell
          session={SESSION}
          enabledOwners={SESSION.owners}
          hiddenOwners={[]}
          onHiddenOwnersChange={noop}
          activeOwner={OWNER}
          onSignOut={noop}
        />
      </SearchProvider>
      <ViewHeader
        filters={[]}
        filtersChanged={false}
        onFiltersChange={noop}
        onResetFilters={noop}
        onSaveAsNewView={noop}
        filterMenu={null}
        onFilterMenuChange={noop}
        orgPrs={PULL_REQUESTS}
        scopedPrs={PULL_REQUESTS}
        viewer={VIEWER}
      >
        <ViewTabs
          views={VIEWS}
          viewCounts={VIEW_COUNTS}
          allOpenCount={PULL_REQUESTS.length}
          activeViewId={null}
          deletableViewId={null}
          renamingViewId={null}
          viewHref={() => "#"}
          onRenamingViewChange={noop}
          onRenameView={noop}
          onDeleteView={noop}
        />
        <DraftsToggle hideDrafts={false} onHideDraftsChange={noop} />
        <FilterButton />
        <DisplayMenu
          open={false}
          onOpenChange={noop}
          group="repo"
          onGroupChange={noop}
          allGroupsCollapsed={false}
        />
      </ViewHeader>
      <div className="pb-4">
        <PrTable
          groups={GROUPS}
          query=""
          onClearSearch={noop}
          group="repo"
          compact={false}
          selectedId={null}
          onSelect={noop}
          now={now}
          onShowAll={noop}
          onToggleGroup={noop}
          onToggleStar={noop}
        />
      </div>
    </div>
  );
}
