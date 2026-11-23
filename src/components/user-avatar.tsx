import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  login: string;
  avatarUrl: string;
  className?: string;
}

export const UserAvatar = ({
  login,
  avatarUrl,
  className,
}: UserAvatarProps) => (
  <Avatar
    className={cn("[--avatar-size:--spacing(4.5)]", className)}
    title={login}
  >
    <AvatarImage src={avatarUrl} alt={login} />
    <AvatarFallback>{login[0]?.toUpperCase()}</AvatarFallback>
  </Avatar>
);
