import { describe, expect, it } from "vite-plus/test";

import { parseGroupsByOwner } from "./storage";

describe("parseGroupsByOwner", () => {
  it("reads groups per owner", () => {
    const stored = { acme: ["repo:web"], globex: ["author:bob"] };
    expect(parseGroupsByOwner(JSON.stringify(stored))).toEqual(stored);
  });

  it("discards the ownerless list stored by earlier versions", () => {
    expect(
      parseGroupsByOwner(JSON.stringify(["repo:web", "author:bob"]))
    ).toEqual({});
  });
});
