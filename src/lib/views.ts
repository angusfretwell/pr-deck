import type { View } from "../types";

export const ALL_OPEN_NAME = "All open";

export const seedViews = (): View[] => [
  {
    id: crypto.randomUUID(),
    name: "Mine",
    filters: [{ key: "author", values: ["@me"], negated: false }],
  },
  {
    id: crypto.randomUUID(),
    name: "Needs my review",
    filters: [{ key: "myReview", values: ["requested"], negated: false }],
  },
  {
    id: crypto.randomUUID(),
    name: "Ready to merge",
    filters: [
      { key: "ci", values: ["pass"], negated: false },
      { key: "conflicts", values: ["clean"], negated: false },
      { key: "review", values: ["approved"], negated: false },
    ],
  },
];

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
