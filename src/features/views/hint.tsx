import type { DisplayHotkeyChord } from "@tanstack/react-hotkeys";
import type { ReactElement } from "react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortcutKeys } from "@/features/shortcuts/shortcut-keys";

export function Hint({
  label,
  hotkey,
  children,
}: {
  label: string;
  hotkey?: DisplayHotkeyChord;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipPopup>
        {hotkey === undefined ? (
          label
        ) : (
          <span className="flex items-center gap-2">
            {label}
            <ShortcutKeys hotkey={hotkey} />
          </span>
        )}
      </TooltipPopup>
    </Tooltip>
  );
}
