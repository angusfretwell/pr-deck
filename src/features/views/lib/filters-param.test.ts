import { describe, expect, it } from "vite-plus/test";

import type { Filter } from "@/types";

import { filtersParam, serializeFilters } from "./filters-param";

const filters: Filter[] = [
  { key: "author", values: ["@me", "bob"], negated: false },
  { key: "ci", values: ["fail"], negated: true },
  { key: "repo", values: ["acme/web.app"], negated: false },
];

describe("filtersParam", () => {
  it("writes filters as search terms", () => {
    expect(serializeFilters("/acme/mine", { filters })).toBe(
      "/acme/mine?filters=author:@me,bob+-ci:fail+repo:acme/web.app"
    );
  });

  it("reads back what it writes", () => {
    expect(filtersParam.parse(filtersParam.serialize(filters))).toEqual(
      filters
    );
  });

  it("keeps an empty list apart from no filters", () => {
    expect(filtersParam.parse("")).toEqual([]);
    expect(serializeFilters("/acme/mine", { filters: [] })).toBe(
      "/acme/mine?filters="
    );
    expect(serializeFilters("/acme/mine", { filters: null })).toBe(
      "/acme/mine"
    );
  });

  it("rejects unknown properties and empty values", () => {
    expect(() => filtersParam.parse("colour:red")).toThrow();
    expect(() => filtersParam.parse("author:")).toThrow();
  });
});
