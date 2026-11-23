import type { Filter, PropertyKey, PullRequest } from "../types";
import { CI_BADGE, REVIEW_BADGE, viewerReview } from "./pr";

export interface Option {
  value: string;
  label: string;
}

export interface Property {
  key: PropertyKey;
  name: string;
  noun: string;
  options: (prs: PullRequest[], viewer: string) => Option[];
  valueOf: (pr: PullRequest, viewer: string) => string;
  fromStatus?: true;
}

export const VIEWER_VALUE = "@me";

const fromBadges = (badges: Record<string, { label: string }>) =>
  Object.entries(badges).map(([value, badge]) => ({
    value,
    label: badge.label,
  }));

const distinct = (values: string[]) =>
  [...new Set(values)].sort().map((value) => ({ value, label: value }));

export const PROPERTIES: Property[] = [
  {
    key: "author",
    name: "Author",
    noun: "authors",
    options: (prs, viewer) => [
      { value: VIEWER_VALUE, label: "Me" },
      ...distinct(
        prs.map((pr) => pr.author).filter((author) => author !== viewer)
      ),
    ],
    valueOf: (pr, viewer) => (pr.author === viewer ? VIEWER_VALUE : pr.author),
  },
  {
    key: "ci",
    fromStatus: true,
    name: "CI",
    noun: "states",
    options: () => fromBadges(CI_BADGE),
    valueOf: (pr) => pr.ci,
  },
  {
    key: "conflicts",
    fromStatus: true,
    name: "Merge conflicts",
    noun: "states",
    options: () => [
      { value: "conflict", label: "Has conflicts" },
      { value: "clean", label: "No conflicts" },
      { value: "unknown", label: "Unknown" },
    ],
    valueOf: (pr) => pr.mergeability,
  },
  {
    key: "review",
    fromStatus: true,
    name: "Review",
    noun: "states",
    options: () => fromBadges(REVIEW_BADGE),
    valueOf: (pr) => pr.review,
  },
  {
    key: "myReview",
    fromStatus: true,
    name: "My review",
    noun: "states",
    options: () => [
      { value: "requested", label: "Review requested" },
      ...fromBadges(REVIEW_BADGE),
    ],
    valueOf: viewerReview,
  },
  {
    key: "repo",
    name: "Repository",
    noun: "repositories",
    options: (prs) => distinct(prs.map((pr) => pr.repo)),
    valueOf: (pr) => pr.repo,
  },
];

export const PROPERTY = Object.fromEntries(
  PROPERTIES.map((property) => [property.key, property])
) as Record<PropertyKey, Property>;

export const passes = (pr: PullRequest, filters: Filter[], viewer: string) =>
  filters.every(
    (filter) =>
      filter.values.includes(PROPERTY[filter.key].valueOf(pr, viewer)) !==
      filter.negated
  );

export const awaitsStatus = (filters: Filter[], prs: PullRequest[]) =>
  filters.some((filter) => PROPERTY[filter.key].fromStatus) &&
  prs.some((pr) => pr.statusPending);

export interface Facet {
  option: Option;
  checked: boolean;
  count: number;
}

export function facets(
  property: Property,
  filters: Filter[],
  scopedPrs: PullRequest[],
  orgPrs: PullRequest[],
  viewer: string
): Facet[] {
  const others = filters.filter((filter) => filter.key !== property.key);

  const selected =
    filters.find((filter) => filter.key === property.key)?.values ?? [];

  const candidates = scopedPrs.filter((pr) => passes(pr, others, viewer));

  return property.options(orgPrs, viewer).map((option) => ({
    option,
    checked: selected.includes(option.value),
    count: candidates.filter(
      (pr) => property.valueOf(pr, viewer) === option.value
    ).length,
  }));
}

export function filterSummary(
  filter: Filter,
  orgPrs: PullRequest[],
  viewer: string
) {
  const property = PROPERTY[filter.key];
  const options = property.options(orgPrs, viewer);

  const labels = filter.values.map(
    (value) => options.find((option) => option.value === value)?.label ?? value
  );

  return labels.length > 2
    ? `${labels.length} ${property.noun}`
    : labels.join(", ");
}

export function matchesText(pr: PullRequest, query: string) {
  const needle = query.trim().toLowerCase();

  return (
    !needle ||
    `${pr.title} ${pr.repo} #${pr.number} ${pr.author}`
      .toLowerCase()
      .includes(needle)
  );
}

export function toggleValue(
  filters: Filter[],
  key: PropertyKey,
  value: string,
  negated = false
): Filter[] {
  const existing = filters.find((filter) => filter.key === key);

  if (!existing) {
    return [...filters, { key, values: [value], negated }];
  }

  const values = existing.values.includes(value)
    ? existing.values.filter((v) => v !== value)
    : [...existing.values, value];

  if (!values.length) {
    return filters.filter((filter) => filter !== existing);
  }

  return filters.map((filter) =>
    filter === existing ? { ...filter, values } : filter
  );
}

const signature = (filters: Filter[]) =>
  JSON.stringify(
    filters
      .map((filter) => [filter.key, filter.negated, [...filter.values].sort()])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  );

export const sameFilters = (a: Filter[], b: Filter[]) =>
  signature(a) === signature(b);
