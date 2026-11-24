import { createContext, use, useCallback, useRef } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useResizeObserver } from "usehooks-ts";

const PinnedViewHeaderContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

function usePinnedViewHeaderRef() {
  const ref = use(PinnedViewHeaderContext);

  if (!ref) {
    throw new Error(
      "PinnedViewHeader must be used within a PinnedViewHeaderFrame"
    );
  }

  return ref;
}

export function PinnedViewHeaderFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { height = 0 } = useResizeObserver({ ref, box: "border-box" });

  const style: CSSProperties & Record<"--view-header-height", string> = {
    "--view-header-height": `${height}px`,
  };

  return (
    <PinnedViewHeaderContext value={ref}>
      <div
        className="flex min-h-0 flex-1 flex-col [--pinned-height:0px] max-md:[--pinned-height:calc(--spacing(12.5)+var(--view-header-height))]"
        style={style}
      >
        {children}
      </div>
    </PinnedViewHeaderContext>
  );
}

export function PinnedViewHeader({ children }: { children: ReactNode }) {
  const ref = usePinnedViewHeaderRef();

  return (
    <div className="max-md:h-(--view-header-height)">
      <div
        ref={ref}
        className="bg-background max-md:fixed max-md:inset-x-0 max-md:top-12.5 max-md:z-20"
      >
        {children}
      </div>
    </div>
  );
}

export function usePinnedViewHeaderBottom() {
  const ref = usePinnedViewHeaderRef();

  return useCallback(
    () => ref.current?.getBoundingClientRect().bottom ?? 0,
    [ref]
  );
}
