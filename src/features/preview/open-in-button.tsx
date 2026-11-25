import { ChevronDownIcon, MarkGithubIcon } from "@primer/octicons-react";
import { useRef } from "react";
import type { ComponentType } from "react";

import {
  ResponsiveMenu,
  ResponsiveMenuGroup,
  ResponsiveMenuGroupLabel,
  ResponsiveMenuLinkItem,
  ResponsiveMenuPopup,
  ResponsiveMenuTrigger,
} from "@/components/responsive-menu";
import { Button } from "@/components/ui/button";
import { Group, GroupSeparator } from "@/components/ui/group";
import { OPEN_IN_HREFS, useOpenInHref } from "@/lib/open-in";
import { usePreferences } from "@/lib/preferences";
import type { OpenIn } from "@/types";

import { DiffsHubIcon, T3CodeIcon } from "./brand-icons";

const TARGETS: Record<OpenIn, { label: string; Icon: ComponentType }> = {
  github: { label: "GitHub", Icon: MarkGithubIcon },
  diffshub: { label: "DiffsHub", Icon: DiffsHubIcon },
  t3code: { label: "T3 Code", Icon: T3CodeIcon },
};

function isOpenIn(value: string): value is OpenIn {
  return Object.hasOwn(TARGETS, value);
}

export function OpenInButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const openIn = usePreferences((state) => state.openIn);
  const { label, Icon } = TARGETS[openIn] ?? TARGETS.github;
  const href = useOpenInHref(url);
  const groupRef = useRef<HTMLFieldSetElement>(null);

  return (
    <Group ref={groupRef} aria-label="Open pull request" className={className}>
      <Button
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open in ${label}`}
          />
        }
      >
        <Icon />
        Open
      </Button>
      <GroupSeparator className="bg-primary/72" />
      <ResponsiveMenu>
        <ResponsiveMenuTrigger
          render={<Button size="icon" aria-label="Open in…" />}
        >
          <ChevronDownIcon className="size-4" />
        </ResponsiveMenuTrigger>
        <ResponsiveMenuPopup
          anchor={groupRef}
          align="end"
          className="min-w-(--anchor-width)"
        >
          <ResponsiveMenuGroup>
            <ResponsiveMenuGroupLabel>Open in</ResponsiveMenuGroupLabel>
            {Object.keys(TARGETS)
              .filter(isOpenIn)
              .map((target) => {
                const option = TARGETS[target];

                return (
                  <ResponsiveMenuLinkItem
                    key={target}
                    href={OPEN_IN_HREFS[target](url)}
                    target="_blank"
                    rel="noopener"
                    onClick={() => {
                      usePreferences.setState({ openIn: target });
                    }}
                  >
                    <option.Icon />
                    {option.label}
                  </ResponsiveMenuLinkItem>
                );
              })}
          </ResponsiveMenuGroup>
        </ResponsiveMenuPopup>
      </ResponsiveMenu>
    </Group>
  );
}
