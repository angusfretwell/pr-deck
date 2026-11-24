import { create } from "zustand";

import type { MenuAnchor } from "@/features/views/filter-context";
import type { FilterMenuState } from "@/features/views/view-header";

interface Overlays {
  filterMenu: FilterMenuState | null;
  displayMenuOpen: boolean;
  paletteOpen: boolean;
}

const CLOSED: Overlays = {
  filterMenu: null,
  displayMenuOpen: false,
  paletteOpen: false,
};

export const useOverlays = create<Overlays>(() => CLOSED);

export function changeFilterMenu(
  anchor: MenuAnchor | null,
  filtersChanged: boolean
) {
  useOverlays.setState({
    filterMenu: anchor && {
      anchor,
      deferBar: anchor === "header" && !filtersChanged,
    },
  });
}

export function setDisplayMenuOpen(displayMenuOpen: boolean) {
  useOverlays.setState({ displayMenuOpen });
}

export function setPaletteOpen(paletteOpen: boolean) {
  useOverlays.setState({ paletteOpen });
}

export function togglePalette() {
  useOverlays.setState((state) => ({ paletteOpen: !state.paletteOpen }));
}

export function closeOverlays() {
  useOverlays.setState(CLOSED);
}
