import { useOrgList } from "@/components/org/org-list-context";
import { useOrgOverlays } from "@/components/org/org-overlays-context";
import { FilterButton, ViewHeader } from "@/components/view-header";
import { DisplayMenu } from "@/components/view-header/display-menu";
import { DraftsToggle } from "@/components/view-header/drafts-toggle";
import { ViewTabs } from "@/components/view-header/view-tabs";

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
    actions: { setHideDrafts },
  } = useOrgList();

  return (
    <DraftsToggle hideDrafts={hideDrafts} onHideDraftsChange={setHideDrafts} />
  );
}

function OrgDisplayMenu() {
  const {
    state: { group, groupsCollapsed },
    actions: { setGroup, toggleAllGroups },
  } = useOrgList();

  const {
    state: { displayMenuOpen },
    actions: { setDisplayMenuOpen },
  } = useOrgOverlays();

  return (
    <DisplayMenu
      open={displayMenuOpen}
      onOpenChange={setDisplayMenuOpen}
      group={group}
      onGroupChange={setGroup}
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

  const {
    state: { filterMenu },
    actions: { changeFilterMenu },
  } = useOrgOverlays();

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
      onFilterMenuChange={changeFilterMenu}
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
