import { DisplayMenu } from "@/features/views/display-menu";
import { DraftsToggle } from "@/features/views/drafts-toggle";
import { FilterButton, ViewHeader } from "@/features/views/view-header";
import { ViewTabs } from "@/features/views/view-tabs";
import { usePreferences } from "@/lib/preferences";
import {
  changeFilterMenu,
  setDisplayMenuOpen,
  useOverlays,
} from "@/pages/org/lib/overlays-store";

import { useOrgList } from "./org-list-context";

function OrgViewTabs() {
  const {
    state: { views, viewCounts, allOpenCount },
    actions: { commit },
  } = useOrgList();

  return (
    <ViewTabs
      views={views.list}
      viewCounts={viewCounts}
      allOpenCount={allOpenCount}
      activeViewId={views.active?.id ?? null}
      deletableViewId={views.deletableViewId}
      renamingViewId={views.session.renamingViewId}
      viewHref={views.hrefFor}
      onRenamingViewChange={(id) => {
        commit(views.setRenaming(id));
      }}
      onRenameView={(id, name) => {
        commit(views.rename(id, name));
      }}
      onDeleteView={(id) => {
        commit(views.remove(id));
      }}
    />
  );
}

function OrgDraftsToggle() {
  const {
    state: { hideDrafts },
  } = useOrgList();

  return (
    <DraftsToggle
      hideDrafts={hideDrafts}
      onHideDraftsChange={(next) => {
        usePreferences.setState({ hideDrafts: next });
      }}
    />
  );
}

function OrgDisplayMenu() {
  const {
    state: { group, groupsCollapsed },
    actions: { toggleAllGroups },
  } = useOrgList();

  const displayMenuOpen = useOverlays((state) => state.displayMenuOpen);

  return (
    <DisplayMenu
      open={displayMenuOpen}
      onOpenChange={setDisplayMenuOpen}
      group={group}
      onGroupChange={(next) => {
        usePreferences.setState({ group: next });
      }}
      allGroupsCollapsed={groupsCollapsed}
      onToggleAllGroups={toggleAllGroups}
    />
  );
}

export function OrgViewHeader() {
  const {
    state: { views, orgPrs, list },
    actions: { commit },
    meta: { viewer },
  } = useOrgList();

  const filterMenu = useOverlays((state) => state.filterMenu);

  return (
    <ViewHeader
      filters={views.filters}
      filtersChanged={views.filtersChanged}
      onFiltersChange={(next) => {
        commit(views.setFilters(next));
      }}
      onResetFilters={() => {
        commit(views.resetFilters());
      }}
      onSaveView={
        views.active
          ? () => {
              commit(views.save());
            }
          : undefined
      }
      onSaveAsNewView={() => {
        commit(views.saveAsNew());
      }}
      filterMenu={filterMenu}
      onFilterMenuChange={(anchor) => {
        changeFilterMenu(anchor, views.filtersChanged);
      }}
      orgPrs={orgPrs}
      scopedPrs={list.scoped}
      viewer={viewer}
    >
      <OrgViewTabs />
      <OrgDraftsToggle />
      <FilterButton />
      <OrgDisplayMenu />
    </ViewHeader>
  );
}
