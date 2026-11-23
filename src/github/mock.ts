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

import { PENDING_STATUS } from "./mapping";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`;

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

const reviewStates: ReviewState[] = [
  "none",
  "approved",
  "changes",
  "comment",
  "none",
];

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

const branch = (index: number) => `feature/change-${index}`;
const STACKED_ON: Record<number, number> = { 6: 0, 12: 6, 18: 12, 7: 1 };

const pollsUntilMergeable = new Map<string, number>();

const settledMergeability = (index: number) =>
  mergeStates[index % mergeStates.length];

function pullRequests(owner: string): PullRequest[] {
  return Array.from({ length: 48 }, (_, index) => {
    const id = `${owner}-${index}`;
    const author = authors[index % authors.length];
    const review = reviewStates[index % reviewStates.length];

    if (index % 7 === 2 && !pollsUntilMergeable.has(id)) {
      pollsUntilMergeable.set(id, index < 24 ? 1 : 2);
    }

    return {
      id,
      owner,
      repo: repos[(index * 7) % repos.length],
      number: 1200 - index * 3,
      title: titles[index % titles.length],
      url: `https://github.com/${owner}/${repos[0]}/pull/${1200 - index * 3}`,
      author,
      authorAvatarUrl: avatar(author),
      isDraft: index % 9 === 4,
      branch: branch(index),
      baseBranch: index in STACKED_ON ? branch(STACKED_ON[index]) : "main",
      isCrossRepository: false,
      updatedAt: new Date(Date.now() - index * 47 * 60_000).toISOString(),
      ci: ciStates[index % ciStates.length],
      mergeability: pollsUntilMergeable.get(id)
        ? "unknown"
        : settledMergeability(index),
      review,
      reviewers:
        review === "none"
          ? []
          : [
              {
                login: authors[(index + 2) % authors.length],
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

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const fence = (code: string, language?: string) =>
  `<div class="${language ? `highlight highlight-source-${language}` : "snippet-clipboard-content"} notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="${escapeHtml(code)}"><pre class="notranslate"><code>${escapeHtml(code)}</code></pre></div>`;

const codeSample = fence(
  `export function retry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  return task().catch((error: unknown) => {
    if (attempts <= 1) throw error;
    return retry(task, attempts - 1);
  });
}`,
  "ts"
);

const shellSample = fence(
  "pnpm install\npnpm test -- --run src/lib/retry.test.ts",
  "shell"
);

const diffSample = fence(
  `- const timeout = 1000;
+ const timeout = 5000;
  fetchWithTimeout(url, timeout);`,
  "diff"
);

const plainSample = fence(
  "Error: request timed out after 1000ms\n    at fetchWithTimeout (src/lib/http.ts:42:11)"
);

const detail = (): PullRequestDetail => ({
  bodyHtml: `<h2>Summary</h2>${paragraph}${codeSample}${paragraph}${diffSample}<h2>Testing</h2><ul><li>Unit tests${shellSample}</li><li>Manual check on iOS Safari</li><li>Staging deploy</li></ul><p>The old behaviour logged:</p>${plainSample}${paragraph.repeat(3)}`,
  additions: 412,
  deletions: 96,
  changedFiles: 14,
  checks: [
    { name: "build", state: "pass", seconds: 84, url: null, required: true },
    { name: "test", state: "fail", seconds: 212, url: null, required: true },
    { name: "lint", state: "pass", seconds: 31, url: null, required: false },
    {
      name: "deploy-preview",
      state: "pending",
      seconds: null,
      url: null,
      required: false,
    },
  ],
  files: Array.from({ length: 14 }, (_, index) => ({
    path: `src/features/module-${index}/index.ts`,
    additions: 10 + index * 7,
    deletions: index * 2,
  })),
});

const delay = async <T>(value: T) =>
  await new Promise<T>((resolve) =>
    setTimeout(() => {
      resolve(value);
    }, 300)
  );

export const fetchSession = async (_token: string) => await delay(session());

export async function fetchPullRequests(
  _token: string,
  owner: string,
  _viewer: string,
  onRows: (list: PullRequestList) => void = () => {}
): Promise<PullRequestList> {
  const list = { pullRequests: pullRequests(owner), totalCount: 48 };
  onRows(
    await delay({
      ...list,
      pullRequests: list.pullRequests.map((pr) => ({
        ...pr,
        ...PENDING_STATUS,
        statusPending: true as const,
      })),
    })
  );

  return await delay(list);
}

export const fetchMergeability = async (_token: string, ids: string[]) =>
  await delay<Record<string, Mergeability>>(
    Object.fromEntries(
      ids.map((id) => {
        const remaining = Math.max(0, (pollsUntilMergeable.get(id) ?? 0) - 1);
        pollsUntilMergeable.set(id, remaining);
        const index = Number(id.split("-").at(-1));

        return [id, remaining > 0 ? "unknown" : settledMergeability(index)];
      })
    )
  );

export const fetchPullRequestDetail = async (_token: string, _id: string) =>
  await delay(detail());
