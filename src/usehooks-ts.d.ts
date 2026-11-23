import type { RefObject } from "react";

interface Size {
  width: number | undefined;
  height: number | undefined;
}

declare module "usehooks-ts" {
  export function useResizeObserver<
    T extends HTMLElement = HTMLElement,
  >(options: {
    ref: RefObject<T | null>;
    onResize?: (size: Size) => void;
    box?: "border-box" | "content-box" | "device-pixel-content-box";
  }): Size;
}
