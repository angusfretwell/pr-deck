import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import {
  filtersParam,
  serializeFilters,
} from "@/features/views/lib/filters-param";
import { openViews } from "@/features/views/lib/views";
import type { ViewsChange } from "@/features/views/lib/views";
import { usePreferences } from "@/lib/preferences";
import type { View } from "@/types";

function storeViews(
  owner: string,
  views: View[],
  replacing: View[] | undefined
) {
  usePreferences.setState((state) =>
    state.views[owner] === replacing
      ? { views: { ...state.views, [owner]: views } }
      : state
  );
}

export function useViews(owner: string, slug: string | null) {
  const stored = usePreferences((state) => state.views[owner]);
  const [draft, setDraft] = useQueryState("filters", filtersParam);
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const opened = openViews({
    owner,
    stored,
    slug,
    session: { draft, renamingViewId },
  });

  const activeId = opened.active?.id ?? null;

  const views = {
    ...opened,
    hrefFor: (id: string | null) =>
      id === activeId
        ? serializeFilters(opened.hrefFor(id), { filters: draft })
        : opened.hrefFor(id),
  };

  const { list } = views;
  useEffect(() => {
    if (list !== stored) {
      storeViews(owner, list, stored);
    }
  }, [list, stored, owner]);

  if (stored === undefined) {
    return null;
  }

  function commit(change: ViewsChange) {
    if (change.views !== stored) {
      storeViews(owner, change.views, stored);
    }

    setRenamingViewId(change.session.renamingViewId);

    if (change.navigate) {
      navigate(
        serializeFilters(change.navigate.to, { filters: change.session.draft }),
        { replace: change.navigate.replace }
      );
    } else {
      void setDraft(change.session.draft);
    }
  }

  return { views, commit };
}
