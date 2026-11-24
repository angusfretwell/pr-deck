import { CheckIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";

export function Check() {
  return <CheckIcon className="text-muted-foreground size-3.5" />;
}

export function Count({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {children}
    </span>
  );
}
