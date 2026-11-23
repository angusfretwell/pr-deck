import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { MotionValue, PanInfo } from "motion/react";
import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "wouter";

import { cn } from "@/lib/utils";

export interface SwipeNeighbour {
  href: string;
  content: ReactNode;
}

interface ViewSwipeProps {
  previous: SwipeNeighbour | null;
  next: SwipeNeighbour | null;
  topInset: () => number;
  className?: string;
  children: ReactNode;
}

const COMMIT_FRACTION = 0.3;
const FLICK_VELOCITY = 500;
const FLICK_DISTANCE = 40;
const EDGE_RESISTANCE = 0.2;
const PAGE = { type: "spring", duration: 0.35, bounce: 0 } as const;
const SNAP_BACK = { type: "spring", duration: 0.3, bounce: 0 } as const;
const FADE_IN_FRACTION = 1 / 3;

interface NeighbourPaneProps {
  paneRef: RefObject<HTMLDivElement | null>;
  opacity: MotionValue<number>;
  className: string;
  contentClassName?: string;
  children: ReactNode;
}

const NeighbourPane = ({
  paneRef,
  opacity,
  className,
  contentClassName,
  children,
}: NeighbourPaneProps) => (
  <motion.div
    inert
    aria-hidden
    className={cn("absolute inset-y-0 w-full will-change-[opacity]", className)}
    style={{ opacity }}
  >
    <div ref={paneRef} className="absolute inset-x-0 h-0 overflow-clip">
      <div
        className={cn(
          contentClassName,
          "min-h-[calc(100dvh-var(--pinned-height))]"
        )}
      >
        {children}
      </div>
    </div>
  </motion.div>
);

export const ViewSwipe = ({
  previous,
  next,
  topInset,
  className,
  children,
}: ViewSwipeProps) => {
  const [, navigate] = useLocation();
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);

  const neighbourOpacity = useTransform(x, (value) =>
    Math.min(Math.abs(value) / (innerWidth * FADE_IN_FRACTION), 1)
  );

  const track = useRef<HTMLDivElement>(null);
  const previousPane = useRef<HTMLDivElement>(null);
  const nextPane = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);

  const panes = () => [previousPane.current, nextPane.current];

  const settle = () => {
    track.current?.style.removeProperty("will-change");

    for (const pane of panes()) {
      pane?.style.removeProperty("height");
    }
  };

  const land = (href: string, pane: HTMLElement) => {
    const trackElement = track.current;

    if (trackElement === null) {
      return;
    }

    const scrollShift =
      trackElement.getBoundingClientRect().top -
      pane.getBoundingClientRect().top;

    x.jump(0);
    trackElement.style.transform = "none";
    flushSync(() => {
      navigate(href);
    });
    settle();
    scrollBy(0, scrollShift);
  };

  const onDirectionLock = (axis: "x" | "y") => {
    const trackElement = track.current;

    if (axis !== "x" || trackElement === null) {
      return;
    }

    trackElement.style.willChange = "transform";

    const top = Math.max(
      0,
      topInset() - trackElement.getBoundingClientRect().top
    );

    for (const pane of panes()) {
      pane?.style.setProperty("top", `${top}px`);
      pane?.style.setProperty(
        "height",
        `${Math.max(screen.height, innerHeight)}px`
      );
    }
  };

  const onDragEnd = (
    event: PointerEvent | MouseEvent | TouchEvent,
    { offset, velocity }: PanInfo
  ) => {
    const position = x.get();

    const horizontal =
      event.type !== "pointercancel" && Math.abs(offset.x) > Math.abs(offset.y);

    const flicked =
      Math.abs(velocity.x) > FLICK_VELOCITY &&
      Math.abs(position) > FLICK_DISTANCE;

    const pastThreshold = Math.abs(position) > innerWidth * COMMIT_FRACTION;

    const dragDirection = pastThreshold ? Math.sign(position) : 0;
    const direction = flicked ? Math.sign(velocity.x) : dragDirection;

    const target = direction < 0 ? next : previous;
    const pane = (direction < 0 ? nextPane : previousPane).current;

    if (!horizontal || direction === 0 || !target || !pane) {
      animate(x, 0, { ...SNAP_BACK, velocity: velocity.x, onComplete: settle });

      return;
    }

    if (reducedMotion === true) {
      land(target.href, pane);

      return;
    }

    animate(x, direction * innerWidth, {
      ...PAGE,
      velocity: velocity.x,
      onComplete: () => {
        land(target.href, pane);
      },
    });
  };

  const enabled = previous !== null || next !== null;

  return (
    <motion.div
      ref={track}
      className={cn("relative", className)}
      style={{ x }}
      drag={enabled && "x"}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{
        left: next ? 1 : EDGE_RESISTANCE,
        right: previous ? 1 : EDGE_RESISTANCE,
      }}
      dragMomentum={false}
      onPointerDownCapture={() => {
        dragged.current = false;
      }}
      onDragStart={() => {
        dragged.current = true;
      }}
      onDirectionLock={onDirectionLock}
      onDragEnd={onDragEnd}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.stopPropagation();
        }
      }}
    >
      {previous && (
        <NeighbourPane
          paneRef={previousPane}
          opacity={neighbourOpacity}
          className="right-full"
          contentClassName={className}
        >
          {previous.content}
        </NeighbourPane>
      )}
      {children}
      {next && (
        <NeighbourPane
          paneRef={nextPane}
          opacity={neighbourOpacity}
          className="left-full"
          contentClassName={className}
        >
          {next.content}
        </NeighbourPane>
      )}
    </motion.div>
  );
};
