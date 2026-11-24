import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { NuqsAdapter, enableHistorySync } from "nuqs/adapters/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { syncPreferencesAcrossTabs, usePreferences } from "@/lib/preferences";
import "@fontsource-variable/inter";
import "@fontsource-variable/google-sans-code";

import "./index.css";
import {
  persistOptions,
  queryClient,
  refetchRestoredQueries,
} from "@/lib/query-cache";

import App from "./app.tsx";

const mockFlag: unknown = import.meta.env.VITE_MOCK;

if (mockFlag !== undefined && mockFlag !== "") {
  usePreferences.setState({ token: "mock" });
}

syncPreferencesAcrossTabs();

enableHistorySync();

const rootElement = document.querySelector("#root");

if (rootElement === null) {
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={refetchRestoredQueries}
    >
      <NuqsAdapter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </NuqsAdapter>
    </PersistQueryClientProvider>
  </StrictMode>
);
