import { create } from "zustand";

export const useKeyboardViewHref = create<string | null>(() => null);

export function setKeyboardViewHref(href: string) {
  useKeyboardViewHref.setState(href, true);
}
