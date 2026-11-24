import { animate } from "motion/react";
import type { AnimationPlaybackControls, PanInfo } from "motion/react";
import { useRef } from "react";
import type { MouseEvent, RefObject } from "react";

import { useDesktop } from "@/lib/use-desktop";

import { viewportOf } from "./use-center-active";

export function usePanScroll(navRef: RefObject<HTMLElement | null>) {
  const desktop = useDesktop();
  const glide = useRef<AnimationPlaybackControls>(null);
  const panned = useRef(false);

  return {
    onPointerDownCapture() {
      panned.current = false;
      glide.current?.stop();
    },
    onPanStart() {
      panned.current = !desktop;
    },
    onPan(_: PointerEvent, { delta }: PanInfo) {
      const viewport = viewportOf(navRef.current);

      if (panned.current && viewport) {
        viewport.scrollLeft -= delta.x;
      }
    },
    onPanEnd(_: PointerEvent, { velocity }: PanInfo) {
      const strip = viewportOf(navRef.current);

      if (!panned.current || !strip) {
        return;
      }

      glide.current = animate(strip.scrollLeft, strip.scrollLeft, {
        type: "inertia",
        velocity: -velocity.x,
        min: 0,
        max: strip.scrollWidth - strip.clientWidth,
        onUpdate: (left) => {
          strip.scrollLeft = left;
        },
      });
    },
    onClickCapture(event: MouseEvent) {
      if (panned.current) {
        event.stopPropagation();
      }
    },
  };
}
