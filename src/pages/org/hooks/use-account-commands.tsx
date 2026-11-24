import { useLocation } from "wouter";

import { AccountAvatar } from "@/components/account-avatar";
import type { PaletteCommand } from "@/components/command-palette/command-palette";
import { Check } from "@/components/command-palette/parts";
import { useOrgList } from "@/pages/org/org-list-context";

export function useAccountCommands() {
  const {
    meta: { owner, owners },
  } = useOrgList();

  const [, navigate] = useLocation();

  return owners.map((account) => ({
    id: `owner:${account.login}`,
    keywords: `switch account organisation ${account.login} ${account.name}`,
    icon: <AccountAvatar account={account} className="size-4 rounded-sm" />,
    label: `Switch to ${account.login}`,
    end: account.login === owner ? <Check /> : undefined,
    run: () => {
      navigate(`/${account.login}`);
    },
  })) satisfies PaletteCommand[];
}
