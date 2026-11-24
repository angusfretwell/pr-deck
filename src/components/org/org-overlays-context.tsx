import { createContext, use, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { FilterMenuState } from "@/components/view-header";
import type { MenuAnchor } from "@/components/view-header/filter-context";

export interface OrgOverlaysState {
  filterMenu: FilterMenuState | null;
  displayMenuOpen: boolean;
  paletteOpen: boolean;
}

export interface OrgOverlaysActions {
  changeFilterMenu: (anchor: MenuAnchor | null) => void;
  setDisplayMenuOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
}

export interface OrgOverlaysContextValue {
  state: OrgOverlaysState;
  actions: OrgOverlaysActions;
}

const OrgOverlaysContext = createContext<OrgOverlaysContextValue | null>(null);

interface OrgOverlaysProviderProps {
  viewId: string | null;
  filtersChanged: boolean;
  children: ReactNode;
}

export function OrgOverlaysProvider({
  viewId,
  filtersChanged,
  children,
}: OrgOverlaysProviderProps) {
  const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shownViewId, setShownViewId] = useState(viewId);

  if (shownViewId !== viewId) {
    setShownViewId(viewId);
    setFilterMenu(null);
  }

  const value = useMemo(
    () =>
      ({
        state: { filterMenu, displayMenuOpen, paletteOpen },
        actions: {
          changeFilterMenu(anchor) {
            setFilterMenu(
              anchor && {
                anchor,
                deferBar: anchor === "header" && !filtersChanged,
              }
            );
          },
          setDisplayMenuOpen,
          setPaletteOpen,
          togglePalette() {
            setPaletteOpen((open) => !open);
          },
        },
      }) satisfies OrgOverlaysContextValue,
    [filterMenu, displayMenuOpen, paletteOpen, filtersChanged]
  );

  return <OrgOverlaysContext value={value}>{children}</OrgOverlaysContext>;
}

export function useOrgOverlays() {
  const context = use(OrgOverlaysContext);

  if (!context) {
    throw new Error(
      "useOrgOverlays must be used within an OrgOverlaysProvider"
    );
  }

  return context;
}
