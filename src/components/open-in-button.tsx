import { ChevronDownIcon, MarkGithubIcon } from "@primer/octicons-react";
import { useRef } from "react";
import type { ComponentType } from "react";

import { DiffsHubIcon, T3CodeIcon } from "@/components/brand-icons";
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
import { useOpenIn } from "@/lib/storage";
import type { OpenIn } from "@/types";

const TARGETS: Record<
  OpenIn,
  { label: string; Icon: ComponentType; href: (url: string) => string }
> = {
  github: { label: "GitHub", Icon: MarkGithubIcon, href: (url) => url },
  diffshub: {
    label: "DiffsHub",
    Icon: DiffsHubIcon,
    href: (url) => url.replace("https://github.com/", "https://diffshub.com/"),
  },
  t3code: {
    label: "T3 Code",
    Icon: T3CodeIcon,
    href: (url) => `https://app.t3.codes/new?pr=${encodeURIComponent(url)}`,
  },
};

const isOpenIn = (value: string): value is OpenIn =>
  Object.hasOwn(TARGETS, value);

export const OpenInButton = ({
  url,
  className,
}: {
  url: string;
  className?: string;
}) => {
  const [openIn, setOpenIn] = useOpenIn();
  const { label, Icon, href } = TARGETS[openIn] ?? TARGETS.github;
  const groupRef = useRef<HTMLFieldSetElement>(null);

  return (
    <Group ref={groupRef} aria-label="Open pull request" className={className}>
      <Button
        render={
          <a
            href={href(url)}
            target="_blank"
            rel="noopener"
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
                    href={option.href(url)}
                    target="_blank"
                    rel="noopener"
                    onClick={() => {
                      setOpenIn(target);
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
};
