import type { Filter, PullRequest, View } from "../types";
import { awaitsStatus, passes, sameFilters, VIEWER_VALUE } from "./filters";

export const ALL_OPEN_NAME = "Open";

const DEFAULT_VIEWS: { name: string; filters: Filter[] }[] = [
  {
    name: "Mine",
    filters: [{ key: "author", values: [VIEWER_VALUE], negated: false }],
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

const seedViews = (): View[] =>
  DEFAULT_VIEWS.map((view) => ({
    ...view,
    id: crypto.randomUUID(),
    isDefault: true,
  }));

const matchesDefault = (view: View) =>
  DEFAULT_VIEWS.some(
    (seed) => seed.name === view.name && sameFilters(seed.filters, view.filters)
  );

const markDefaults = (views: View[]) =>
  views.some((view) => !view.isDefault && matchesDefault(view))
    ? views.map((view) =>
        matchesDefault(view) ? { ...view, isDefault: true } : view
      )
    : views;

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "") || "view";

function uniqueName(views: View[], name: string, exceptId?: string) {
  const base = name.trim() || "Untitled view";

  const taken = new Set(
    views
      .filter((view) => view.id !== exceptId)
      .map((view) => slugify(view.name))
  );

  let candidate = base;

  for (let n = 2; taken.has(slugify(candidate)); n++) {
    candidate = `${base} ${n}`;
  }

  return candidate;
}

export const countByView = (
  views: View[],
  prs: PullRequest[],
  viewer: string
): Record<string, number> =>
  Object.fromEntries(
    views
      .filter((view) => !awaitsStatus(view.filters, prs))
      .map((view) => [
        view.id,
        prs.filter((pr) => passes(pr, view.filters, viewer)).length,
      ])
  );

export interface ViewsSession {
  draft: { viewId: string | null; filters: Filter[] } | null;
  renamingViewId: string | null;
}

export const NEW_SESSION: ViewsSession = { draft: null, renamingViewId: null };

export interface ViewsChange {
  views: View[];
  session: ViewsSession;
  navigate?: { to: string; replace?: boolean };
}

export interface Views {
  list: View[];
  active: View | null;
  redirectTo: string | null;
  session: ViewsSession;
  filters: Filter[];
  filtersChanged: boolean;
  deletableViewId: string | null;
  hrefFor: (id: string | null) => string;
  setFilters: (filters: Filter[]) => ViewsChange;
  resetFilters: () => ViewsChange;
  showAll: () => ViewsChange;
  save: () => ViewsChange;
  saveAsNew: () => ViewsChange;
  setRenaming: (id: string | null) => ViewsChange;
  rename: (id: string, name: string) => ViewsChange;
  remove: (id: string) => ViewsChange;
}

interface OpenViewsInput {
  owner: string;
  stored: View[] | undefined;
  slug: string | null;
  session?: ViewsSession;
}

export function openViews({
  owner,
  stored,
  slug,
  session = NEW_SESSION,
}: OpenViewsInput): Views {
  const list = stored ? markDefaults(stored) : seedViews();
  const root = `/${owner}`;
  const pathFor = (name: string) => `${root}/${slugify(name)}`;

  const found =
    slug === null ? null : list.find((view) => slugify(view.name) === slug);

  const active = found ?? null;
  const activeId = active?.id ?? null;

  const current =
    session.draft && session.draft.viewId !== activeId
      ? { ...session, draft: null }
      : session;

  const savedFilters = active?.filters ?? [];
  const filters = current.draft?.filters ?? savedFilters;

  const unchanged: ViewsChange = { views: list, session: current };

  return {
    list,
    active,
    redirectTo: found === undefined ? root : null,
    session: current,
    filters,
    filtersChanged: !sameFilters(filters, savedFilters),
    deletableViewId: active && !active.isDefault ? active.id : null,

    hrefFor: (id) => {
      const view = list.find((candidate) => candidate.id === id);

      return view ? pathFor(view.name) : root;
    },

    setFilters: (next) => ({
      ...unchanged,
      session: { ...current, draft: { viewId: activeId, filters: next } },
    }),

    resetFilters: () => ({
      ...unchanged,
      session: { ...current, draft: null },
    }),

    showAll: () => ({
      ...unchanged,
      session: { ...current, draft: null },
      navigate: { to: root },
    }),

    save: () =>
      active
        ? {
            views: list.map((view) =>
              view.id === active.id ? { ...view, filters } : view
            ),
            session: { ...current, draft: null },
          }
        : unchanged,

    saveAsNew: () => {
      const view = {
        id: crypto.randomUUID(),
        name: uniqueName(list, "New view"),
        filters,
      };

      return {
        views: [...list, view],
        session: { draft: null, renamingViewId: view.id },
        navigate: { to: pathFor(view.name) },
      };
    },

    setRenaming: (id) => ({
      ...unchanged,
      session: { ...current, renamingViewId: id },
    }),

    rename: (id, requestedName) => {
      const name = uniqueName(list, requestedName, id);

      return {
        views: list.map((view) => (view.id === id ? { ...view, name } : view)),
        session: { ...current, renamingViewId: null },
        ...(id === activeId && {
          navigate: { to: pathFor(name), replace: true },
        }),
      };
    },

    remove: (id) =>
      list.some((view) => view.id === id && !view.isDefault)
        ? {
            ...unchanged,
            views: list.filter((view) => view.id !== id),
            navigate: { to: root },
          }
        : unchanged,
  };
}
