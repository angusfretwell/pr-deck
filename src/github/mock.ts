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

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`;
}

function account(login: string, name: string) {
  return {
    login,
    name,
    avatarUrl: avatar(login),
  } satisfies Account;
}

function session() {
  const viewer = account("you", "You");

  return {
    viewer,
    owners: [
      viewer,
      account("acme", "Acme"),
      account("globex", "Globex"),
      account("initech", "Initech"),
    ],
  } satisfies Session;
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

function branch(index: number) {
  return `feature/change-${index}`;
}

const STACKED_ON = new Map([
  [6, 0],
  [12, 6],
  [18, 12],
  [7, 1],
]);

const pollsUntilMergeable = new Map<string, number>();

function settledMergeability(index: number) {
  return mergeStates[index % mergeStates.length];
}

function pullRequests(owner: string) {
  return Array.from({ length: 48 }, (_, index) => {
    const id = `${owner}-${index}`;
    const author = authors[index % authors.length];
    const review = reviewStates[index % reviewStates.length];
    const stackedOn = STACKED_ON.get(index);

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
      baseBranch: stackedOn === undefined ? "main" : branch(stackedOn),
      isCrossRepository: false,
      updatedAt: new Date(Date.now() - index * 47 * 60_000).toISOString(),
      ci: ciStates[index % ciStates.length],
      mergeability:
        (pollsUntilMergeable.get(id) ?? 0) === 0
          ? settledMergeability(index)
          : "unknown",
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
    } satisfies PullRequest;
  });
}

const paragraph =
  "<p>This change tidies up the flow and adds coverage for the edge cases we hit in production last week. It should be safe to roll out behind the existing flag.</p>";

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fence(code: string, language?: string) {
  return `<div class="${language !== undefined && language !== "" ? `highlight highlight-source-${language}` : "snippet-clipboard-content"} notranslate position-relative overflow-auto" data-snippet-clipboard-copy-content="${escapeHtml(code)}"><pre class="notranslate"><code>${escapeHtml(code)}</code></pre></div>`;
}

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

function detail() {
  return {
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
  } satisfies PullRequestDetail;
}

async function delay<T>(value: T) {
  const { promise, resolve } = Promise.withResolvers<T>();
  setTimeout(() => {
    resolve(value);
  }, 300);

  return await promise;
}

export async function fetchSession(_token: string) {
  return await delay(session());
}

export async function fetchPullRequests(
  _token: string,
  owner: string,
  _viewer: string,
  onRows?: (list: PullRequestList) => void
) {
  const list = {
    pullRequests: pullRequests(owner),
    totalCount: 48,
  } satisfies PullRequestList;

  const rows = await delay({
    ...list,
    pullRequests: list.pullRequests.map((pr) => ({
      ...pr,
      ...PENDING_STATUS,
      statusPending: true as const,
    })),
  });

  onRows?.(rows);

  return await delay(list);
}

export async function fetchMergeability(_token: string, ids: string[]) {
  return await delay<Record<string, Mergeability>>(
    Object.fromEntries(
      ids.map((id) => {
        const remaining = Math.max(0, (pollsUntilMergeable.get(id) ?? 0) - 1);
        pollsUntilMergeable.set(id, remaining);
        const index = Number(id.split("-").at(-1));

        return [id, remaining > 0 ? "unknown" : settledMergeability(index)];
      })
    )
  );
}

export async function fetchPullRequestDetail(_token: string, _id: string) {
  return await delay(detail());
}
