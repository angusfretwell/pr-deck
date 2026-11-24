import { ChevronDownIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Section({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Lines({ children }: { children: ReactNode }) {
  return <div className="bg-card divide-y rounded-lg border">{children}</div>;
}

export function Line({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-1.75">{children}</div>;
}

export function ShowMore({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="px-1.5 py-1">
      <Button variant="ghost" size="sm" onClick={onClick}>
        <ChevronDownIcon />
        {children}
      </Button>
    </div>
  );
}

export function SkeletonLines() {
  return (
    <Lines>
      {["w-1/2", "w-2/3", "w-2/5"].map((width) => (
        <Line key={width}>
          <span className="flex h-lh w-full items-center">
            <Skeleton className={cn("h-4.5", width)} />
          </span>
        </Line>
      ))}
    </Lines>
  );
}
