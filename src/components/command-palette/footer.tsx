import { ArrowDownIcon, ArrowUpIcon } from "@primer/octicons-react";

import { CommandFooter } from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function PaletteFooter() {
  return (
    <CommandFooter>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <KbdGroup>
            <Kbd>
              <ArrowUpIcon />
            </Kbd>
            <Kbd>
              <ArrowDownIcon />
            </Kbd>
          </KbdGroup>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <Kbd>↵</Kbd>
          <span>Run</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Kbd>Esc</Kbd>
        <span>Close</span>
      </div>
    </CommandFooter>
  );
}
