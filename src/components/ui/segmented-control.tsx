"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "@/lib/utils";

export type SegmentedControlSize = "default" | "lg" | "sm";

export const segmentedControlItemSizeClassNames: Record<
  SegmentedControlSize,
  string
> = {
  default: "h-8.5 px-[calc(--spacing(2.5)-1px)] sm:h-7.5",
  lg: "h-9.5 px-[calc(--spacing(3)-1px)] sm:h-8.5",
  sm: "h-7.5 px-[calc(--spacing(2)-1px)] sm:h-6.5",
};

export const segmentedControlItemLayoutClassName =
  "gap-1.5 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0";

export const segmentedControlIndicatorSurfaceClassName =
  "rounded-md bg-background shadow-sm/5 dark:bg-input";

const SegmentedControlContext: React.Context<SegmentedControlSize> =
  React.createContext<SegmentedControlSize>("default");

const activeItemSelector =
  ':scope > [data-checked], :scope > [aria-current="page"], :scope > [data-pressed]';

const observedAttributes: string[] = [
  "data-checked",
  "aria-current",
  "data-pressed",
];

const MAX_LAYOUT_ROUNDING_ERROR = 2;

interface ActiveItemRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

function isSameRect(a: ActiveItemRect | null, b: ActiveItemRect | null) {
  return (
    a?.left === b?.left &&
    a?.top === b?.top &&
    a?.width === b?.width &&
    a?.height === b?.height
  );
}

function parsePixels(value: string) {
  return Number(value.replace(/px$/u, "")) || 0;
}

function getCssSize(element: HTMLElement) {
  const style = getComputedStyle(element);
  const width = parsePixels(style.width);
  const height = parsePixels(style.height);

  if (
    Math.round(width) !== element.offsetWidth ||
    Math.round(height) !== element.offsetHeight
  ) {
    return { height: element.offsetHeight, width: element.offsetWidth };
  }

  return { height, width };
}

function measureItem(item: HTMLElement, root: HTMLElement) {
  const { width, height } = getCssSize(item);
  const rootSize = getCssSize(root);
  const itemRect = item.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const scaleX = rootSize.width > 0 ? rootRect.width / rootSize.width : 1;
  const scaleY = rootSize.height > 0 ? rootRect.height / rootSize.height : 1;

  const rectLeft =
    (itemRect.left - rootRect.left) / scaleX -
    root.clientLeft +
    root.scrollLeft;

  const rectTop =
    (itemRect.top - rootRect.top) / scaleY - root.clientTop + root.scrollTop;

  const isUndistorted =
    Math.abs(rectLeft - item.offsetLeft) <= MAX_LAYOUT_ROUNDING_ERROR &&
    Math.abs(rectTop - item.offsetTop) <= MAX_LAYOUT_ROUNDING_ERROR;

  return {
    height,
    left: isUndistorted ? rectLeft : item.offsetLeft,
    top: isUndistorted ? rectTop : item.offsetTop,
    width,
  } satisfies ActiveItemRect;
}

function observeActiveItem(
  root: HTMLElement,
  setRect: React.Dispatch<React.SetStateAction<ActiveItemRect | null>>
) {
  function update() {
    const item = root.querySelector<HTMLElement>(activeItemSelector);
    const next = item ? measureItem(item, root) : null;
    setRect((previous) => (isSameRect(previous, next) ? previous : next));
  }

  update();

  const resizeObserver = new ResizeObserver(update);

  function observeItems() {
    resizeObserver.disconnect();
    resizeObserver.observe(root);

    for (const child of root.children) {
      resizeObserver.observe(child);
      mutationObserver.observe(child, {
        attributeFilter: observedAttributes,
        attributes: true,
      });
    }
  }

  const mutationObserver = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList")) {
      observeItems();
    }

    update();
  });

  mutationObserver.observe(root, { childList: true });
  observeItems();

  return () => {
    resizeObserver.disconnect();
    mutationObserver.disconnect();
  };
}

type IndicatorStyle = React.CSSProperties &
  Record<`--active-item-${string}`, string>;

function SegmentedControlIndicator() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [rect, setRect] = React.useState<ActiveItemRect | null>(null);

  React.useLayoutEffect(() => {
    const root = ref.current?.parentElement;

    return root ? observeActiveItem(root, setRect) : undefined;
  }, []);

  const style: IndicatorStyle = {
    "--active-item-height": `${rect?.height ?? 0}px`,
    "--active-item-left": `${rect?.left ?? 0}px`,
    "--active-item-top": `${rect?.top ?? 0}px`,
    "--active-item-width": `${rect?.width ?? 0}px`,
  };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 -z-1 h-(--active-item-height) w-(--active-item-width) translate-x-(--active-item-left) translate-y-(--active-item-top) transition-[width,height,translate] duration-200 ease-in-out motion-reduce:transition-none",
        segmentedControlIndicatorSurfaceClassName
      )}
      data-slot="segmented-control-indicator"
      hidden={!rect}
      ref={ref}
      style={style}
    />
  );
}

export function SegmentedControl({
  className,
  children,
  render,
  size = "default",
  ...props
}: useRender.ComponentProps<"div"> & {
  size?: SegmentedControlSize;
}) {
  const defaultProps = {
    children: (
      <>
        {children}
        <SegmentedControlIndicator />
      </>
    ),
    className: cn(
      "bg-muted relative z-0 flex w-fit items-center justify-center gap-0.5 rounded-lg p-0.5",
      className
    ),
    "data-size": size,
    "data-slot": "segmented-control",
  };

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });

  return (
    <SegmentedControlContext.Provider value={size}>
      {element}
    </SegmentedControlContext.Provider>
  );
}

export function SegmentedControlItem({
  className,
  render,
  size,
  ...props
}: useRender.ComponentProps<"button"> & {
  size?: SegmentedControlSize;
}) {
  const contextSize = React.useContext(SegmentedControlContext);
  const resolvedSize = size ?? contextSize;

  const baseProps = {
    className: cn(
      "text-muted-foreground/72 hover:text-muted-foreground focus-visible:outline-ring relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent text-base font-medium whitespace-nowrap outline-2 outline-transparent transition-[color,outline-color] select-none hover:bg-transparent disabled:pointer-events-none disabled:opacity-64 data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-sm",
      "data-checked:bg-background data-checked:text-foreground dark:data-checked:bg-input data-checked:shadow-sm/5",
      "aria-[current=page]:bg-background aria-[current=page]:text-foreground dark:aria-[current=page]:bg-input aria-[current=page]:shadow-sm/5",
      "data-pressed:bg-background data-pressed:text-foreground dark:data-pressed:bg-input data-pressed:shadow-sm/5",
      "[:has(>[data-slot=segmented-control-indicator]:not([hidden]))>&]:bg-transparent! [:has(>[data-slot=segmented-control-indicator]:not([hidden]))>&]:shadow-none!",
      segmentedControlItemLayoutClassName,
      segmentedControlItemSizeClassNames[resolvedSize],
      className
    ),
    "data-size": resolvedSize,
    "data-slot": "segmented-control-item",
  };

  const defaultProps = render
    ? baseProps
    : { ...baseProps, type: "button" as const };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
