import { useEffect, useRef } from "react";
import type { RefObject, TransitionEvent } from "react";

function translateX(element: Element) {
  const [x = ""] = getComputedStyle(element).translate.split(" ");

  return Number(x.replace(/px$/u, "")) || 0;
}

export function viewportOf(strip: HTMLElement | null) {
  return strip?.closest("[data-slot=scroll-area-viewport]");
}

function centerActive(strip: HTMLElement | null, shouldGlide: boolean) {
  const viewport = viewportOf(strip);

  if (!strip || !viewport) {
    return;
  }

  const from = viewport.scrollLeft - translateX(strip);

  strip
    .querySelector('[aria-current="page"]')
    ?.scrollIntoView({ inline: "center", block: "nearest" });
  const shift = viewport.scrollLeft - from;

  if (!shouldGlide || !shift) {
    return;
  }

  strip.style.transition = "none";
  strip.style.translate = `${shift}px`;
  strip.getBoundingClientRect();
  strip.style.transition = "";
  strip.style.translate = "";
}

export function useCenterActive(
  navRef: RefObject<HTMLElement | null>,
  activeViewId: string | null,
  countsKey: string
) {
  const centeredFor = useRef<{
    viewId: string | null;
    countsKey: string;
  } | null>(null);

  useEffect(() => {
    const previous = centeredFor.current;

    if (previous?.viewId === activeViewId && previous.countsKey === countsKey) {
      return;
    }

    centeredFor.current = { viewId: activeViewId, countsKey };
    centerActive(
      navRef.current,
      previous !== null && previous.viewId !== activeViewId
    );
  }, [navRef, activeViewId, countsKey]);

  return function recenterOnCountTransition(event: TransitionEvent) {
    if (event.propertyName === "grid-template-columns") {
      centerActive(navRef.current, true);
    }
  };
}
