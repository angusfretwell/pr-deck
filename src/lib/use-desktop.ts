import { useMediaQuery } from "usehooks-ts";

export function useDesktop() {
  return useMediaQuery("(min-width: 768px)");
}
