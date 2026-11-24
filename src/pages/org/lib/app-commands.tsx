import { SyncIcon } from "@primer/octicons-react";

import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { resetQueryCache } from "@/lib/query-cache";

export const APP_COMMANDS: PaletteCommand[] = [
  {
    id: "cache:clear",
    keywords: "clear cache reload refresh refetch data",
    icon: <SyncIcon />,
    label: "Clear cache",
    run: resetQueryCache,
  },
];
