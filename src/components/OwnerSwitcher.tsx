import { ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";
import { AccountAvatar } from "@/components/account-avatar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Account } from "@/types";

const OVERFLOW_TRIGGER_WIDTH = 64;

interface OwnerSwitcherProps {
  owners: Account[];
  viewerLogin: string;
  activeOwner: string;
  onSelect: (owner: string) => void;
}

export function OwnerSwitcher(props: OwnerSwitcherProps) {
  const desktop = useMediaQuery("(min-width: 768px)");
  return desktop ? <OwnerTabs {...props} /> : <OwnerDropdown {...props} />;
}

function OwnerDropdown(props: OwnerSwitcherProps) {
  const active = props.owners.find((owner) => owner.login === props.activeOwner);
  return (
    <OwnerMenu
      {...props}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="me-auto shrink-0 justify-start gap-2 px-2 font-semibold"
        />
      }
    >
      {active && <AccountAvatar account={active} className="size-5 shrink-0 rounded-sm" />}
      <span className="max-w-32 truncate" title={props.activeOwner}>
        {props.activeOwner}
      </span>
      <ChevronsUpDownIcon className="text-muted-foreground" />
    </OwnerMenu>
  );
}

function OwnerTabs(props: OwnerSwitcherProps) {
  const { owners, activeOwner, onSelect } = props;
  const container = useRef<HTMLDivElement>(null);
  const measurer = useRef<HTMLDivElement>(null);
  const [visibleLogins, setVisibleLogins] = useState(() => owners.map((owner) => owner.login));

  useLayoutEffect(() => {
    const available = container.current;
    const list = measurer.current;
    if (!available || !list) return;
    const update = () => {
      const widths = [...list.querySelectorAll<HTMLElement>('[data-slot="tabs-tab"]')].map(
        (tab) => tab.getBoundingClientRect().width,
      );
      setVisibleLogins(fitOwners(owners, widths, activeOwner, available.clientWidth));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(available);
    observer.observe(list);
    return () => observer.disconnect();
  }, [owners, activeOwner]);

  const visible = owners.filter((owner) => visibleLogins.includes(owner.login));
  const overflow = owners.filter((owner) => !visibleLogins.includes(owner.login));

  return (
    <div ref={container} className="relative flex min-w-0 flex-1 items-center gap-1">
      <div ref={measurer} aria-hidden inert className="invisible absolute top-0 left-0 w-max">
        <Tabs value={activeOwner}>
          <OwnerTabList owners={owners} />
        </Tabs>
      </div>
      {visible.length > 0 && (
        <Tabs className="min-w-0" value={activeOwner} onValueChange={onSelect}>
          <OwnerTabList owners={visible} />
        </Tabs>
      )}
      {overflow.length > 0 && (
        <OwnerMenu
          {...props}
          owners={overflow}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 px-2 text-muted-foreground"
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

function fitOwners(owners: Account[], widths: number[], activeOwner: string, available: number) {
  const listPadding = 4;
  const tabGap = 2;
  const total = widths.reduce((sum, width) => sum + width + tabGap, listPadding);
  if (total <= available) return owners.map((owner) => owner.login);

  const activeIndex = owners.findIndex((owner) => owner.login === activeOwner);
  const fitted = new Set(activeIndex === -1 ? [] : [activeIndex]);
  let used = listPadding + OVERFLOW_TRIGGER_WIDTH + (widths[activeIndex] ?? 0);
  for (const [index, width] of widths.entries()) {
    if (index === activeIndex) continue;
    if (used + width + tabGap > available) break;
    used += width + tabGap;
    fitted.add(index);
  }
  return owners.filter((_, index) => fitted.has(index)).map((owner) => owner.login);
}

function OwnerTabList({ owners }: { owners: Account[] }) {
  return (
    <TabsList className="max-w-full">
      {owners.map((owner) => (
        <TabsTab key={owner.login} value={owner.login} className="min-w-0 shrink overflow-hidden">
          <AccountAvatar account={owner} className="size-4.5 shrink-0 rounded-sm" />
          <span className="max-w-45 min-w-0 truncate" title={owner.login}>
            {owner.login}
          </span>
        </TabsTab>
      ))}
    </TabsList>
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
    { label: "Personal account", accounts: owners.filter((owner) => owner.login === viewerLogin) },
    { label: "Organisations", accounts: owners.filter((owner) => owner.login !== viewerLogin) },
  ];
  return (
    <Menu>
      <MenuTrigger render={trigger}>{children}</MenuTrigger>
      <MenuPopup align="start" className="w-72">
        <MenuRadioGroup value={activeOwner} onValueChange={(owner: string) => onSelect(owner)}>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {groups.map(
              ({ label, accounts }) =>
                accounts.length > 0 && (
                  <MenuGroup key={label}>
                    <MenuGroupLabel>{label}</MenuGroupLabel>
                    {accounts.map((owner) => (
                      <MenuRadioItem
                        key={owner.login}
                        value={owner.login}
                        closeOnClick
                        className="grid-cols-[.75rem_minmax(0,1fr)]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <AccountAvatar account={owner} className="size-4 shrink-0 rounded-sm" />
                          <span className="truncate" title={owner.login}>
                            {owner.login}
                          </span>
                        </span>
                      </MenuRadioItem>
                    ))}
                  </MenuGroup>
                ),
            )}
          </div>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
