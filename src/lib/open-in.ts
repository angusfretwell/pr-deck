import { usePreferences } from "@/lib/preferences";
import type { OpenIn } from "@/types";

export const OPEN_IN_HREFS: Record<OpenIn, (url: string) => string> = {
  github: (url) => url,
  diffshub: (url) =>
    url.replace("https://github.com/", "https://diffshub.com/"),
  t3code: (url) => `https://app.t3.codes/new?pr=${encodeURIComponent(url)}`,
};

function hrefFor(openIn: OpenIn, url: string) {
  return (OPEN_IN_HREFS[openIn] ?? OPEN_IN_HREFS.github)(url);
}

export function useOpenInHref(url: string) {
  return hrefFor(
    usePreferences((state) => state.openIn),
    url
  );
}

export function openPullRequest(url: string) {
  window.open(
    hrefFor(usePreferences.getState().openIn, url),
    "_blank",
    "noopener"
  );
}
