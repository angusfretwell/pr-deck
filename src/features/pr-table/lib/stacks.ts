import type { PullRequest } from "@/types";

export interface Stack {
  id: string;
  layers: PullRequest[];
}

export type StackIndex = Map<string, Stack>;

export interface Cluster {
  stack: Stack | null;
  rows: PullRequest[];
}

function branchKey(pr: PullRequest, branch: string) {
  return `${pr.owner}/${pr.repo}:${branch}`;
}

export function deriveStacks(pullRequests: PullRequest[]) {
  const byHead = new Map<string, PullRequest>();

  for (const pr of pullRequests) {
    if (!pr.isCrossRepository) {
      byHead.set(branchKey(pr, pr.branch), pr);
    }
  }

  function parentOf(pr: PullRequest) {
    return byHead.get(branchKey(pr, pr.baseBranch));
  }

  const childOf = new Map<string, PullRequest>();

  for (const pr of pullRequests) {
    const parent = parentOf(pr);

    if (parent && parent !== pr && !childOf.has(parent.id)) {
      childOf.set(parent.id, pr);
    }
  }

  const stacks: StackIndex = new Map();

  for (const root of pullRequests) {
    if (parentOf(root) || !childOf.has(root.id)) {
      continue;
    }

    const layers = [root];

    for (let next = childOf.get(root.id); next; next = childOf.get(next.id)) {
      layers.push(next);
    }

    const stack = { id: root.id, layers };

    for (const layer of layers) {
      stacks.set(layer.id, stack);
    }
  }

  return stacks;
}

export function clusterByStack(rows: PullRequest[], stacks: StackIndex) {
  const shown = new Set(rows.map((pr) => pr.id));
  const clustered = new Set<Stack>();
  const clusters: Cluster[] = [];

  for (const pr of rows) {
    const stack = stacks.get(pr.id);

    if (!stack) {
      clusters.push({ stack: null, rows: [pr] });
    } else if (!clustered.has(stack)) {
      clustered.add(stack);
      clusters.push({
        stack,
        rows: stack.layers.filter((layer) => shown.has(layer.id)),
      });
    }
  }

  return clusters;
}
