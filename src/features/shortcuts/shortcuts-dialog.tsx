import { useHotkey, useHotkeyRegistrations } from "@tanstack/react-hotkeys";
import type {
  HotkeyChord,
  HotkeyRegistrationView,
} from "@tanstack/react-hotkeys";
import { Fragment } from "react";

import {
  Dialog,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";

import { HOTKEYS, SHORTCUT_GROUPS } from "./lib/hotkeys";
import { setShortcutsOpen, useShortcutsOpen } from "./lib/shortcuts-store";
import { ShortcutKeys } from "./shortcut-keys";

function shortcutsIn(group: string, registrations: HotkeyRegistrationView[]) {
  const byName = new Map<string, HotkeyChord[]>();

  for (const registration of registrations) {
    const name = registration.options.meta?.name;

    if (
      registration.kind === "chord" &&
      name !== undefined &&
      registration.options.meta?.group === group
    ) {
      byName.set(name, [...(byName.get(name) ?? []), registration.hotkey]);
    }
  }

  return [...byName];
}

function ShortcutList() {
  const registrations = useHotkeyRegistrations();

  return SHORTCUT_GROUPS.map((group) => {
    const shortcuts = shortcutsIn(group, registrations);

    if (shortcuts.length === 0) {
      return null;
    }

    return (
      <section key={group} className="not-first:mt-5">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          {group}
        </h3>
        <dl className="divide-y">
          {shortcuts.map(([name, hotkeys]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-4 py-2 text-sm"
            >
              <dt>{name}</dt>
              <dd className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {hotkeys.map((hotkey, index) => (
                  <Fragment key={hotkey}>
                    {index > 0 && "or"}
                    <ShortcutKeys hotkey={hotkey} />
                  </Fragment>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  });
}

export function ShortcutsDialog() {
  const open = useShortcutsOpen();

  useHotkey(
    HOTKEYS.shortcuts,
    () => {
      setShortcutsOpen(!open);
    },
    { meta: { name: "Show keyboard shortcuts", group: "General" } }
  );

  return (
    <Dialog open={open} onOpenChange={setShortcutsOpen}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <ShortcutList />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
