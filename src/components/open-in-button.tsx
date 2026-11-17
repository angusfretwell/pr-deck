import { ChevronDownIcon, MarkGithubIcon } from "@primer/octicons-react";
import { type ComponentType, useRef } from "react";
import { DiffsHubIcon, T3CodeIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { Group, GroupSeparator } from "@/components/ui/group";
import { Menu, MenuLinkItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
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

export function OpenInButton({ url, className }: { url: string; className?: string }) {
  const [openIn, setOpenIn] = useOpenIn();
  const { label, Icon, href } = TARGETS[openIn] ?? TARGETS.github;
  const groupRef = useRef<HTMLDivElement>(null);

  return (
    <Group ref={groupRef} aria-label="Open pull request" className={className}>
      <Button
        aria-label={`Open in ${label}`}
        render={<a href={href(url)} target="_blank" rel="noopener" />}
      >
        <Icon />
        Open
      </Button>
      <GroupSeparator className="bg-primary/72" />
      <Menu>
        <MenuTrigger render={<Button size="icon" aria-label="Open in…" />}>
          <ChevronDownIcon className="size-4" />
        </MenuTrigger>
        <MenuPopup anchor={groupRef} align="end" className="min-w-(--anchor-width)">
          {(Object.keys(TARGETS) as OpenIn[]).map((target) => {
            const { label, Icon, href } = TARGETS[target];
            return (
              <MenuLinkItem
                key={target}
                href={href(url)}
                target="_blank"
                rel="noopener"
                onClick={() => setOpenIn(target)}
              >
                <Icon />
                {label}
              </MenuLinkItem>
            );
          })}
        </MenuPopup>
      </Menu>
    </Group>
  );
}
