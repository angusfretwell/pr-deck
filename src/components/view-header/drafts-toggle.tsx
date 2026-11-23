import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";

import { Hint } from "./hint";

const OPTIONS = [
  { label: "All", hint: "Include drafts", hideDrafts: false },
  { label: "Ready", hint: "Hide drafts", hideDrafts: true },
];

interface DraftsToggleProps {
  hideDrafts: boolean;
  onHideDraftsChange: (hideDrafts: boolean) => void;
}

export function DraftsToggle({
  hideDrafts,
  onHideDraftsChange,
}: DraftsToggleProps) {
  return (
    <SegmentedControl
      size="sm"
      role="radiogroup"
      aria-label="Drafts"
      className="ms-auto rounded-full *:data-[slot=segmented-control-indicator]:rounded-full max-md:hidden"
    >
      {OPTIONS.map((option) => {
        const checked = hideDrafts === option.hideDrafts;

        return (
          <Hint key={option.label} label={option.hint}>
            <SegmentedControlItem
              role="radio"
              aria-checked={checked}
              data-checked={checked || undefined}
              onClick={() => {
                onHideDraftsChange(option.hideDrafts);
              }}
              className="h-6 rounded-full sm:h-6"
            >
              {option.label}
            </SegmentedControlItem>
          </Hint>
        );
      })}
    </SegmentedControl>
  );
}
