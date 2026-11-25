import { create } from "zustand";

export const useKeyboardViewHref = create<string | null>(() => null);

export function clearKeyboardViewHref() {
  useKeyboardViewHref.setState(null, true);
}

export function setKeyboardViewHref(href: string) {
  useKeyboardViewHref.setState(href, true);
}
