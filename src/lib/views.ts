import type { Filter, View } from "../types";
import { sameFilters } from "./filters";

export const ALL_OPEN_NAME = "All open";

const DEFAULT_VIEWS: { name: string; filters: Filter[] }[] = [
  {
    name: "Mine",
    filters: [{ key: "author", values: ["@me"], negated: false }],
  },
  {
    name: "Needs my review",
    filters: [{ key: "myReview", values: ["requested"], negated: false }],
  },
  {
    name: "Ready to merge",
    filters: [
      { key: "ci", values: ["pass"], negated: false },
      { key: "conflicts", values: ["clean"], negated: false },
      { key: "review", values: ["approved"], negated: false },
    ],
  },
];

export const seedViews = (): View[] =>
  DEFAULT_VIEWS.map((view) => ({ ...view, id: crypto.randomUUID(), isDefault: true }));

const matchesDefault = (view: View) =>
  DEFAULT_VIEWS.some((seed) => seed.name === view.name && sameFilters(seed.filters, view.filters));

export const needsDefaultMarks = (views: View[]) =>
  views.some((view) => !view.isDefault && matchesDefault(view));

export const markDefaultViews = (views: View[]): View[] =>
  views.map((view) => (matchesDefault(view) ? { ...view, isDefault: true } : view));

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "view";

export const findViewBySlug = (views: View[], slug: string) =>
  views.find((view) => slugify(view.name) === slug);

export function uniqueName(views: View[], name: string, exceptId?: string) {
  const base = name.trim() || "Untitled view";
  const taken = new Set(
    views.filter((view) => view.id !== exceptId).map((view) => slugify(view.name)),
  );
  let candidate = base;
  for (let n = 2; taken.has(slugify(candidate)); n++) candidate = `${base} ${n}`;
  return candidate;
}
