import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  persistOptions,
  queryClient,
  refetchRestoredQueries,
} from "@/lib/query-cache";
import "@fontsource-variable/inter";
import "@fontsource-variable/google-sans-code";

import "./index.css";
import { TOKEN_KEY } from "@/lib/storage";

import App from "./app.tsx";

if (import.meta.env.VITE_MOCK) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify("mock"));
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={refetchRestoredQueries}
    >
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
