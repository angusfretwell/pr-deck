import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { HOTKEYS } from "@/features/shortcuts/lib/hotkeys";

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
      aria-label="Drafts"
      className="ms-auto rounded-full *:data-[slot=segmented-control-indicator]:rounded-full max-md:hidden"
      render={
        <RadioGroup
          value={hideDrafts}
          onValueChange={(next) => {
            onHideDraftsChange(next);
          }}
        />
      }
    >
      {OPTIONS.map((option) => (
        <Hint key={option.label} label={option.hint} hotkey={HOTKEYS.drafts}>
          <SegmentedControlItem
            render={<Radio.Root value={option.hideDrafts} />}
            className="h-6 rounded-full sm:h-6"
          >
            {option.label}
          </SegmentedControlItem>
        </Hint>
      ))}
    </SegmentedControl>
  );
}
