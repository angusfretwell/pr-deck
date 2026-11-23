import { ChevronDownIcon } from "@primer/octicons-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Link } from "wouter";

import { AccountAvatar } from "@/components/account-avatar";
import {
  ResponsiveMenu,
  ResponsiveMenuGroup,
  ResponsiveMenuGroupLabel,
  ResponsiveMenuPopup,
  ResponsiveMenuRadioGroup,
  ResponsiveMenuRadioItem,
  ResponsiveMenuTrigger,
} from "@/components/responsive-menu";
import { Button } from "@/components/ui/button";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { useDesktop } from "@/lib/use-desktop";
import type { Account } from "@/types";

const OVERFLOW_TRIGGER_WIDTH = 64;

interface OwnerSwitcherProps {
  owners: Account[];
  viewerLogin: string;
  activeOwner: string;
  onSelect: (owner: string) => void;
}

export function OwnerSwitcher(props: OwnerSwitcherProps) {
  const desktop = useDesktop();

  return desktop ? <OwnerLinks {...props} /> : <OwnerDropdown {...props} />;
}

function OwnerDropdown(props: OwnerSwitcherProps) {
  const active = props.owners.find(
    (owner) => owner.login === props.activeOwner
  );

  return (
    <OwnerMenu
      {...props}
      trigger={
        <Button variant="ghost" size="sm" className="me-auto font-semibold" />
      }
    >
      {active && (
        <AccountAvatar account={active} className="size-5 rounded-sm" />
      )}
      <span className="max-w-32 truncate" title={props.activeOwner}>
        {props.activeOwner}
      </span>
      <ChevronDownIcon />
    </OwnerMenu>
  );
}

function OwnerLinks(props: OwnerSwitcherProps) {
  const { owners, activeOwner } = props;
  const container = useRef<HTMLDivElement>(null);
  const measurer = useRef<HTMLDivElement>(null);

  const [visibleLogins, setVisibleLogins] = useState(() =>
    owners.map((owner) => owner.login)
  );

  useLayoutEffect(() => {
    const available = container.current;
    const list = measurer.current?.firstElementChild;

    if (!available || !list) {
      return;
    }

    const update = () => {
      const style = getComputedStyle(list);

      const items = list.querySelectorAll(
        '[data-slot="segmented-control-item"]'
      );

      const layout = {
        widths: [...items].map((item) => item.getBoundingClientRect().width),
        gap: Number.parseFloat(style.columnGap) || 0,
        padding:
          Number.parseFloat(style.paddingInlineStart) +
          Number.parseFloat(style.paddingInlineEnd),
      };

      setVisibleLogins(
        fitOwners(owners, layout, activeOwner, available.clientWidth)
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(available);
    observer.observe(list);

    return () => {
      observer.disconnect();
    };
  }, [owners, activeOwner]);

  const visible = owners.filter((owner) => visibleLogins.includes(owner.login));

  const overflow = owners.filter(
    (owner) => !visibleLogins.includes(owner.login)
  );

  return (
    <div
      ref={container}
      className="relative flex min-w-0 flex-1 items-center gap-1"
    >
      <div
        ref={measurer}
        aria-hidden
        inert
        className="invisible absolute start-0 top-0 w-max"
      >
        <OwnerNav owners={owners} activeOwner={activeOwner} />
      </div>
      {visible.length > 0 && (
        <OwnerNav owners={visible} activeOwner={activeOwner} />
      )}
      {overflow.length > 0 && (
        <OwnerMenu
          {...props}
          owners={overflow}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            />
          }
        >
          +{overflow.length}
          <ChevronDownIcon />
        </OwnerMenu>
      )}
    </div>
  );
}

interface NavLayout {
  widths: number[];
  gap: number;
  padding: number;
}

function fitOwners(
  owners: Account[],
  { widths, gap, padding }: NavLayout,
  activeOwner: string,
  available: number
) {
  const total = widths.reduce((sum, width) => sum + width + gap, padding - gap);

  if (total <= available) {
    return owners.map((owner) => owner.login);
  }

  const activeIndex = owners.findIndex((owner) => owner.login === activeOwner);
  const fitted = new Set(activeIndex === -1 ? [] : [activeIndex]);
  let used = padding + OVERFLOW_TRIGGER_WIDTH + (widths[activeIndex] ?? 0);

  for (const [index, width] of widths.entries()) {
    if (index === activeIndex) {
      continue;
    }

    if (used + width + gap > available) {
      break;
    }

    used += width + gap;
    fitted.add(index);
  }

  return owners
    .filter((_, index) => fitted.has(index))
    .map((owner) => owner.login);
}

function OwnerNav({
  owners,
  activeOwner,
}: {
  owners: Account[];
  activeOwner: string;
}) {
  return (
    <SegmentedControl
      aria-label="Accounts"
      render={<nav />}
      className="min-w-0"
    >
      {owners.map((owner) => (
        <SegmentedControlItem
          key={owner.login}
          className="min-w-0 shrink"
          render={
            <Link
              href={`/${owner.login}`}
              aria-current={owner.login === activeOwner ? "page" : undefined}
            />
          }
        >
          <AccountAvatar account={owner} className="size-4.5 rounded-sm" />
          <span className="max-w-45 min-w-0 truncate" title={owner.login}>
            {owner.login}
          </span>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

function OwnerMenu({
  owners,
  viewerLogin,
  activeOwner,
  onSelect,
  trigger,
  children,
}: OwnerSwitcherProps & { trigger: ReactElement; children: ReactNode }) {
  const groups = [
    {
      label: "Personal account",
      accounts: owners.filter((owner) => owner.login === viewerLogin),
    },
    {
      label: "Organisations",
      accounts: owners.filter((owner) => owner.login !== viewerLogin),
    },
  ];

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger render={trigger}>{children}</ResponsiveMenuTrigger>
      <ResponsiveMenuPopup align="start" className="w-72">
        <ResponsiveMenuRadioGroup value={activeOwner} onValueChange={onSelect}>
          {groups.map(
            ({ label, accounts }) =>
              accounts.length > 0 && (
                <ResponsiveMenuGroup key={label}>
                  <ResponsiveMenuGroupLabel>{label}</ResponsiveMenuGroupLabel>
                  {accounts.map((owner) => (
                    <ResponsiveMenuRadioItem
                      key={owner.login}
                      value={owner.login}
                      closeOnClick
                      className="grid-cols-[.75rem_minmax(0,1fr)]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <AccountAvatar
                          account={owner}
                          className="size-4 rounded-sm"
                        />
                        <span className="truncate" title={owner.login}>
                          {owner.login}
                        </span>
                      </span>
                    </ResponsiveMenuRadioItem>
                  ))}
                </ResponsiveMenuGroup>
              )
          )}
        </ResponsiveMenuRadioGroup>
      </ResponsiveMenuPopup>
    </ResponsiveMenu>
  );
}
