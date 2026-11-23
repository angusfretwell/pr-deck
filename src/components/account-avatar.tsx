import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Account } from "@/types";

export const AccountAvatar = ({
  account,
  className,
}: {
  account: Account;
  className: string;
}) => (
  <Avatar className={className}>
    <AvatarImage src={account.avatarUrl} alt="" />
    <AvatarFallback>{account.login[0].toUpperCase()}</AvatarFallback>
  </Avatar>
);
