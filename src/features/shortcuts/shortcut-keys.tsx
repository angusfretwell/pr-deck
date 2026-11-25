import { useFormatForDisplay } from "@tanstack/react-hotkeys";
import type { DisplayHotkeyChord } from "@tanstack/react-hotkeys";

import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function ShortcutKeys({ hotkey }: { hotkey: DisplayHotkeyChord }) {
  const formatForDisplay = useFormatForDisplay();

  return (
    <KbdGroup>
      {formatForDisplay(hotkey, { parts: true }).map((part) => (
        <Kbd key={part}>{part}</Kbd>
      ))}
    </KbdGroup>
  );
}
