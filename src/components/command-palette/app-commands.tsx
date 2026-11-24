import { SyncIcon } from "@primer/octicons-react";

import { resetQueryCache } from "@/lib/query-cache";

import type { PaletteCommand } from "./types";

export const APP_COMMANDS: PaletteCommand[] = [
  {
    id: "cache:clear",
    keywords: "clear cache reload refresh refetch data",
    icon: <SyncIcon />,
    label: "Clear cache",
    run: resetQueryCache,
  },
];
