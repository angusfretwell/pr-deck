import type {
  Account,
  CiState,
  Mergeability,
  PullRequest,
  PullRequestDetail,
  PullRequestList,
  ReviewState,
  Session,
} from "@/types";

const avatar = (seed: string) => `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`;
const account = (login: string, name: string): Account => ({
  login,
  name,
  avatarUrl: avatar(login),
});

function session(): Session {
  const viewer = account("you", "You");
  return {
    viewer,
    owners: [
      viewer,
      account("acme", "Acme"),
      account("globex", "Globex"),
      account("initech", "Initech"),
    ],
  };
}

const repos = ["web", "api", "mobile", "infra", "docs", "design-system"];
const authors = ["you", "sam", "priya", "lee", "noor", "alex", "kai"];
const ciStates: CiState[] = ["pass", "fail", "pending", "none", "pass", "pass"];
const mergeStates: Mergeability[] = ["clean", "clean", "conflict", "clean"];
const reviewStates: ReviewState[] = ["none", "approved", "changes", "comment", "none"];
const titles = [
  "Fix flaky checkout test on slow CI runners",
  "Add dark mode support to the settings page",
  "Bump dependencies and drop the legacy polyfills",
  "Refactor the auth middleware into smaller handlers",
  "Show a retry button when the upload fails",
  "Cache avatar images for offline use",
  "Migrate the billing cron to the new queue",
  "Improve keyboard navigation in the command palette",
  "Paginate the audit log export",
  "Remove the unused feature flag for search v1",
];

const pollsUntilMergeable = new Map<string, number>();
const settledMergeability = (index: number) => mergeStates[index % mergeStates.length]!;

function pullRequests(owner: string): PullRequest[] {
  return Array.from({ length: 48 }, (_, index) => {
    const id = `${owner}-${index}`;
    const author = authors[index % authors.length]!;
    const review = reviewStates[index % reviewStates.length]!;
    if (index % 7 === 2 && !pollsUntilMergeable.has(id)) {
      pollsUntilMergeable.set(id, index < 24 ? 1 : 2);
    }
    return {
      id,
      owner,
      repo: repos[(index * 7) % repos.length]!,
      number: 1200 - index * 3,
      title: titles[index % titles.length]!,
      url: `https://github.com/${owner}/${repos[0]}/pull/${1200 - index * 3}`,
      author,
      authorAvatarUrl: avatar(author),
      isDraft: index % 9 === 4,
      branch: `feature/change-${index}`,
      updatedAt: new Date(Date.now() - index * 47 * 60_000).toISOString(),
      ci: ciStates[index % ciStates.length]!,
      mergeability: pollsUntilMergeable.get(id) ? "unknown" : settledMergeability(index),
      review,
      reviewers:
        review === "none"
          ? []
          : [
              {
                login: authors[(index + 2) % authors.length]!,
                avatarUrl: avatar(`r${index}`),
                verdict: review,
              },
            ],
      reviewRequestedFromViewer: index % 5 === 1,
    };
  });
}

const paragraph =
  "<p>This change tidies up the flow and adds coverage for the edge cases we hit in production last week. It should be safe to roll out behind the existing flag.</p>";

const detail = (): PullRequestDetail => ({
  bodyHtml: `<h2>Summary</h2>${paragraph.repeat(3)}<h2>Testing</h2><ul><li>Unit tests</li><li>Manual check on iOS Safari</li><li>Staging deploy</li></ul>${paragraph.repeat(4)}`,
  additions: 412,
  deletions: 96,
  changedFiles: 14,
  checks: [
    { name: "build", state: "pass", seconds: 84, url: null, required: true },
    { name: "test", state: "fail", seconds: 212, url: null, required: true },
    { name: "lint", state: "pass", seconds: 31, url: null, required: false },
    { name: "deploy-preview", state: "pending", seconds: null, url: null, required: false },
  ],
  files: Array.from({ length: 14 }, (_, index) => ({
    path: `src/features/module-${index}/index.ts`,
    additions: 10 + index * 7,
    deletions: index * 2,
  })),
});

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 300));

export const fetchSession = (_token: string) => delay(session());
export const fetchPullRequests = (_token: string, owner: string, _viewer: string) =>
  delay<PullRequestList>({ pullRequests: pullRequests(owner), totalCount: 48 });
export const fetchMergeability = (_token: string, ids: string[]) =>
  delay<Record<string, Mergeability>>(
    Object.fromEntries(
      ids.map((id) => {
        const remaining = Math.max(0, (pollsUntilMergeable.get(id) ?? 0) - 1);
        pollsUntilMergeable.set(id, remaining);
        const index = Number(id.split("-").at(-1));
        return [id, remaining > 0 ? "unknown" : settledMergeability(index)];
      }),
    ),
  );
export const fetchPullRequestDetail = (_token: string, _id: string) => delay(detail());
