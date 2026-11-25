import {
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
} from "@primer/octicons-react";
import { useLocation } from "wouter";

import { matches } from "@/components/command-palette/command-palette";
import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { BadgeIcon } from "@/components/status-badge";
import { setSearchQuery, useSearch } from "@/features/search/lib/search-store";
import { passes } from "@/features/views/lib/filters";
import { statusBadge } from "@/lib/pr";
import { selectionUrlKeys } from "@/pages/org/lib/selection-param";
import { useOrgList } from "@/pages/org/org-list-context";
import type { PullRequest } from "@/types";

const LIMIT = 8;

function keywordsFor(pr: PullRequest) {
  return `${pr.title} ${pr.repo} #${pr.number} ${pr.author} ${pr.branch}`;
}

export function usePullRequestCommands(needle: string) {
  const {
    state: { views, orgPrs },
    actions: { select },
    meta: { viewer },
  } = useOrgList();

  const [, navigate] = useLocation();
  const searchQuery = useSearch((state) => state.query);

  if (!needle) {
    return [];
  }

  function open(pr: PullRequest) {
    if (searchQuery) {
      setSearchQuery("");
    }

    if (passes(pr, views.filters, viewer)) {
      select(pr.id);

      return;
    }

    const params = new URLSearchParams({
      [selectionUrlKeys.selectedId]: pr.id,
      [selectionUrlKeys.previewOpen]: "true",
    });

    navigate(`${views.hrefFor(null)}?${params}`);
  }

  return orgPrs
    .filter((pr) => matches(keywordsFor(pr), needle))
    .slice(0, LIMIT)
    .map((pr) => ({
      id: `pr:${pr.id}`,
      keywords: keywordsFor(pr),
      icon: pr.isDraft ? <GitPullRequestDraftIcon /> : <GitPullRequestIcon />,
      label: (
        <>
          <bdi>{pr.title}</bdi>
          <span className="ms-1.5 text-muted-foreground">
            {pr.repo} #{pr.number}
          </span>
        </>
      ),
      end: pr.statusPending ? undefined : (
        <BadgeIcon badge={statusBadge(pr)} className="size-3.5" />
      ),
      run: () => {
        open(pr);
      },
    })) satisfies PaletteCommand[];
}
