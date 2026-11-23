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

const mockFlag: unknown = import.meta.env.VITE_MOCK;

if (mockFlag !== undefined && mockFlag !== "") {
  localStorage.setItem(TOKEN_KEY, JSON.stringify("mock"));
}

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
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
