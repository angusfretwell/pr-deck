import { describe, expect, it } from "vite-plus/test";
import { parseCollapsedGroups } from "./storage";

describe("parseCollapsedGroups", () => {
  it("reads collapsed groups per owner", () => {
    const stored = { acme: ["repo:web"], globex: ["author:bob"] };
    expect(parseCollapsedGroups(JSON.stringify(stored))).toEqual(stored);
  });

  it("discards the ownerless list stored by earlier versions", () => {
    expect(parseCollapsedGroups(JSON.stringify(["repo:web", "author:bob"]))).toEqual({});
  });
});
