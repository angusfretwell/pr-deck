import { createParser, createSerializer } from "nuqs";

import type { Filter, PropertyKey } from "@/types";

import { PROPERTIES } from "./filters";

function isPropertyKey(key: string): key is PropertyKey {
  return PROPERTIES.some((property) => property.key === key);
}

function parseFilter(term: string) {
  const negated = term.startsWith("-");
  const [key = "", values = ""] = term.slice(Number(negated)).split(":");

  if (!isPropertyKey(key) || values === "") {
    throw new Error(`Invalid filter: ${term}`);
  }

  return { key, values: values.split(","), negated } satisfies Filter;
}

export const filtersParam = createParser({
  parse: (query) =>
    query
      .split(" ")
      .filter((term) => term !== "")
      .map(parseFilter),
  serialize: (filters: Filter[]) =>
    filters
      .map(
        ({ key, values, negated }) =>
          `${negated ? "-" : ""}${key}:${values.join(",")}`
      )
      .join(" "),
});

export const serializeFilters = createSerializer({ filters: filtersParam });
