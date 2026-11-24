import { useLocation } from "wouter";

import { AccountAvatar } from "@/components/account-avatar";
import { useOrgList } from "@/components/org/org-list-context";

import { Check } from "./parts";
import type { PaletteCommand } from "./types";

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
