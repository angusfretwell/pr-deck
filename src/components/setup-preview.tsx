import { useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { PrTable } from "@/components/pr-table";
import { ViewHeader } from "@/components/view-header";
import { passes } from "@/lib/filters";
import { derivePrList, NO_SELECTION } from "@/lib/pr-list";
import { cn } from "@/lib/utils";
import type { Account, PullRequest, Session, View } from "@/types";

const VIEWER = "sam-k";
const OWNER = "northwind";

const identicon = (login: string) => `https://github.com/identicons/${login}.png`;
const account = (login: string, name: string): Account => ({
  login,
  name,
  avatarUrl: identicon(login),
});

const SESSION: Session = {
  viewer: account(VIEWER, "Sam Kowalczyk"),
  owners: [
    account(VIEWER, "Sam Kowalczyk"),
    account(OWNER, "Northwind"),
    account("fieldwork-labs", "Fieldwork Labs"),
  ],
};

const VIEWS: View[] = [
  {
    id: "mine",
    name: "Mine",
    isDefault: true,
    filters: [{ key: "author", values: ["@me"], negated: false }],
  },
  {
    id: "review",
    name: "Needs my review",
    isDefault: true,
    filters: [{ key: "myReview", values: ["requested"], negated: false }],
  },
  {
    id: "ready",
    name: "Ready to merge",
    isDefault: true,
    filters: [
      { key: "ci", values: ["pass"], negated: false },
      { key: "conflicts", values: ["clean"], negated: false },
      { key: "review", values: ["approved"], negated: false },
    ],
  },
];

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
  ["api", 2841, "Add retry budget to webhook dispatcher", "priya-n", 2, "pass", "approved"],
  ["api", 2836, "Cache org membership lookups for five minutes", VIEWER, 6, "pending", "none"],
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
  ["infra", 412, "Drop Node 18 from the CI matrix", "mkato", 20, "pass", "approved"],
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
  ["web", 1187, "Virtualize the audit log table", VIEWER, 44, "pass", "approved"],
  ["web", 1180, "Keyboard shortcuts for the command menu", "devonte", 70, "pass", "none"],
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
    branch: "main",
    updatedAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
    ci,
    mergeability: "clean",
    review,
    reviewers: [],
    reviewRequestedFromViewer: false,
    ...extra,
  }),
);

const VIEW_COUNTS = Object.fromEntries(
  VIEWS.map((view) => [
    view.id,
    PULL_REQUESTS.filter((pr) => passes(pr, view.filters, VIEWER)).length,
  ]),
);

const { groups: GROUPS } = derivePrList({
  pullRequests: PULL_REQUESTS,
  query: "",
  filters: [],
  viewer: VIEWER,
  group: "repo",
  collapsed: [],
  selection: NO_SELECTION,
  desktop: true,
});

const noop = () => {};

export function SetupPreview({ className }: { className?: string }) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <div
      inert
      aria-hidden
      className={cn(
        "pointer-events-none isolate flex select-none flex-col bg-background",
        className,
      )}
    >
      <AppShell
        session={SESSION}
        enabledOwners={SESSION.owners}
        hiddenOwners={[]}
        onHiddenOwnersChange={noop}
        activeOwner={OWNER}
        query=""
        onQueryChange={noop}
        searchRef={searchRef}
        searchVisible={false}
        onSearchBlur={noop}
        onSignOut={noop}
      />
      <ViewHeader
        views={VIEWS}
        viewCounts={VIEW_COUNTS}
        allOpenCount={PULL_REQUESTS.length}
        activeViewId={null}
        renamingViewId={null}
        viewHref={() => "#"}
        onRenamingViewChange={noop}
        onRenameView={noop}
        onDeleteView={noop}
        filters={[]}
        filtersChanged={false}
        onFiltersChange={noop}
        onResetFilters={noop}
        onSaveView={noop}
        onSaveAsNewView={noop}
        filterMenu={null}
        onFilterMenuChange={noop}
        displayMenuOpen={false}
        onDisplayMenuOpenChange={noop}
        group="repo"
        onGroupChange={noop}
        orgPrs={PULL_REQUESTS}
        scopedPrs={PULL_REQUESTS}
        viewer={VIEWER}
      />
      <div className="pb-4">
        <PrTable
          groups={GROUPS}
          query=""
          onClearSearch={noop}
          group="repo"
          compact={false}
          selectedId={null}
          onSelect={noop}
          onShowAll={noop}
          onToggleGroup={noop}
        />
      </div>
    </div>
  );
}
