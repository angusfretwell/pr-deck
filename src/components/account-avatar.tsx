import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Account } from "@/types";

export function AccountAvatar({ account, className }: { account: Account; className: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={account.avatarUrl} alt="" />
      <AvatarFallback>{account.login[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
