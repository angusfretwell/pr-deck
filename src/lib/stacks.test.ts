import { describe, expect, it } from "vite-plus/test";

import type { PullRequest } from "../types";
import { clusterByStack, deriveStacks } from "./stacks";

const pr = (
  id: string,
  branch: string,
  baseBranch = "main",
  overrides: Partial<PullRequest> = {}
) =>
  ({
    id,
    owner: "acme",
    repo: "web",
    number: Number(id),
    title: `Title ${id}`,
    url: `https://github.com/acme/web/pull/${id}`,
    author: "alice",
    authorAvatarUrl: "",
    isDraft: false,
    branch,
    baseBranch,
    isCrossRepository: false,
    updatedAt: "2026-01-01T00:00:00Z",
    ci: "pass",
    mergeability: "clean",
    review: "none",
    reviewers: [],
    reviewRequestedFromViewer: false,
    ...overrides,
  }) satisfies PullRequest;

const layerIds = (prs: PullRequest[], id: string) =>
  deriveStacks(prs)
    .get(id)
    ?.layers.map((layer) => layer.id);

describe("deriveStacks", () => {
  it("chains pull requests from the one targeting the trunk upwards", () => {
    const prs = [
      pr("3", "c", "b"),
      pr("1", "a"),
      pr("2", "b", "a"),
      pr("4", "solo"),
    ];

    expect(layerIds(prs, "1")).toEqual(["1", "2", "3"]);
    expect(layerIds(prs, "3")).toEqual(["1", "2", "3"]);
    expect(layerIds(prs, "4")).toBeUndefined();
  });

  it("keeps the same branch names in different repositories apart", () => {
    const prs = [pr("1", "a"), pr("2", "b", "a", { repo: "api" })];
    expect(deriveStacks(prs).size).toBe(0);
  });

  it("never stacks on a fork's branch", () => {
    const prs = [
      pr("1", "main", "main", { isCrossRepository: true }),
      pr("2", "feature"),
    ];

    expect(deriveStacks(prs).size).toBe(0);
  });

  it("lets a fork's pull request sit on top of a stack", () => {
    const prs = [
      pr("1", "a"),
      pr("2", "patch", "a", { isCrossRepository: true }),
    ];

    expect(layerIds(prs, "2")).toEqual(["1", "2"]);
  });

  it("follows one branch of a fork in the stack and leaves the other unstacked", () => {
    const prs = [pr("1", "a"), pr("2", "b", "a"), pr("3", "c", "a")];
    expect(layerIds(prs, "1")).toEqual(["1", "2"]);
    expect(layerIds(prs, "3")).toBeUndefined();
  });
});

describe("clusterByStack", () => {
  const prs = [
    pr("3", "c", "b"),
    pr("9", "solo"),
    pr("1", "a"),
    pr("2", "b", "a"),
  ];

  const stacks = deriveStacks(prs);

  const ids = (rows: PullRequest[]) =>
    clusterByStack(rows, stacks).map((cluster) =>
      cluster.rows.map((row) => row.id)
    );

  it("gathers a stack in merge order where its first row appears", () => {
    expect(ids(prs)).toEqual([["1", "2", "3"], ["9"]]);
  });

  it("clusters only the layers that are shown", () => {
    expect(ids([prs[1], prs[0], prs[2]])).toEqual([["9"], ["1", "3"]]);
  });

  it("marks which clusters are stacks", () => {
    expect(
      clusterByStack(prs, stacks).map((cluster) => cluster.stack?.id ?? null)
    ).toEqual(["1", null]);
  });
});
