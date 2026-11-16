import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { persistOptions, queryClient, refetchRestoredQueries } from "@/lib/query-cache";
import "./index.css";
import App from "./app.tsx";
import { TOKEN_KEY } from "@/lib/storage";

if (import.meta.env.VITE_MOCK) localStorage.setItem(TOKEN_KEY, JSON.stringify("mock"));

createRoot(document.getElementById("root")!).render(
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
  </StrictMode>,
);
