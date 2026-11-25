import {
  KeyAsteriskIcon,
  MarkGithubIcon,
  SignOutIcon,
} from "@primer/octicons-react";

import { AccountAvatar } from "@/components/account-avatar";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuGroup,
  ResponsiveMenuGroupLabel,
  ResponsiveMenuItem,
  ResponsiveMenuLinkItem,
  ResponsiveMenuPopup,
  ResponsiveMenuRadioGroup,
  ResponsiveMenuRadioItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/components/responsive-menu";
import { Button } from "@/components/ui/button";
import { openShortcuts } from "@/features/shortcuts/lib/shortcuts-store";
import { useDesktop } from "@/hooks/use-desktop";
import { THEMES, usePreferences } from "@/lib/preferences";
import { REPO_URL } from "@/lib/repo";
import type { Account, Session } from "@/types";

interface AccountMenuProps {
  session: Session;
  enabledOwners: Account[];
  onSignOut: () => void;
}

export function AccountMenu({
  session,
  enabledOwners,
  onSignOut,
}: AccountMenuProps) {
  const hiddenOwners = usePreferences((state) => state.hiddenOwners);
  const colorMode = usePreferences((state) => state.colorMode);
  const desktop = useDesktop();

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Account" />}
      >
        <AccountAvatar account={session.viewer} className="size-5.5" />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuPopup align="end" className="w-64">
        <ResponsiveMenuGroup>
          <ResponsiveMenuGroupLabel>Organisations</ResponsiveMenuGroupLabel>
          {session.owners.map((owner) => {
            const enabled = !hiddenOwners.includes(owner.login);

            return (
              <ResponsiveMenuCheckboxItem
                className="grid-cols-[.75rem_minmax(0,1fr)]"
                key={owner.login}
                checked={enabled}
                disabled={enabled && enabledOwners.length === 1}
                onCheckedChange={(checked) => {
                  usePreferences.setState({
                    hiddenOwners: checked
                      ? hiddenOwners.filter((login) => login !== owner.login)
                      : [...hiddenOwners, owner.login],
                  });
                }}
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
              </ResponsiveMenuCheckboxItem>
            );
          })}
        </ResponsiveMenuGroup>
        <ResponsiveMenuSeparator />
        <ResponsiveMenuGroup>
          <ResponsiveMenuGroupLabel>Theme</ResponsiveMenuGroupLabel>
          <ResponsiveMenuRadioGroup
            value={colorMode}
            onValueChange={(next) => {
              usePreferences.setState({ colorMode: next });
            }}
          >
            {THEMES.map(({ value, label }) => (
              <ResponsiveMenuRadioItem key={value} value={value}>
                {label}
              </ResponsiveMenuRadioItem>
            ))}
          </ResponsiveMenuRadioGroup>
        </ResponsiveMenuGroup>
        <ResponsiveMenuSeparator />
        {desktop && (
          <ResponsiveMenuItem onClick={openShortcuts}>
            <KeyAsteriskIcon />
            Keyboard shortcuts
          </ResponsiveMenuItem>
        )}
        <ResponsiveMenuLinkItem href={REPO_URL} target="_blank" rel="noopener">
          <MarkGithubIcon />
          Source on GitHub
        </ResponsiveMenuLinkItem>
        <ResponsiveMenuSeparator />
        <ResponsiveMenuItem onClick={onSignOut}>
          <SignOutIcon />
          Clear token
        </ResponsiveMenuItem>
      </ResponsiveMenuPopup>
    </ResponsiveMenu>
  );
}
