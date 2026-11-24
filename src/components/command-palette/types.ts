import type { ReactNode } from "react";

export interface PaletteCommand {
  id: string;
  label: ReactNode;
  keywords: string;
  icon: ReactNode;
  end?: ReactNode;
  keepOpen?: boolean;
  run: () => void;
}

export interface Section {
  value: string;
  items: PaletteCommand[];
}
