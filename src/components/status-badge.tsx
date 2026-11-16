import {
  AlertIcon,
  CheckCircleFillIcon,
  CheckIcon,
  CommentIcon,
  DotFillIcon,
  SkipIcon,
  XCircleFillIcon,
  XIcon,
  type Icon,
} from "@primer/octicons-react";
import { Badge as BadgeUi } from "@/components/ui/badge";
import type { Badge, BadgeIconName, Tone } from "@/lib/pr";
import { cn } from "@/lib/utils";

export const pillClassName =
  "h-6 rounded-md bg-foreground/6 px-1.5 text-foreground/80 sm:h-5 dark:bg-foreground/10";

const ICON_TONE: Record<Tone, string> = {
  ok: "text-success",
  bad: "text-destructive",
  warn: "text-warning",
  mute: "text-muted-foreground",
};

const PILL_TONE: Record<Tone, string> = {
  ok: "bg-success/10 text-success-foreground dark:bg-success/16 dark:text-emerald-300",
  bad: "bg-destructive/10 text-destructive-foreground dark:bg-destructive/16 dark:text-red-300",
  warn: "bg-warning/12 text-warning-foreground dark:bg-warning/16 dark:text-amber-300",
  mute: "",
};

const ICON: Record<BadgeIconName, Icon> = {
  pass: CheckCircleFillIcon,
  fail: XCircleFillIcon,
  pending: DotFillIcon,
  ring: SkipIcon,
  check: CheckIcon,
  x: XIcon,
  chat: CommentIcon,
  alert: AlertIcon,
};

function BadgeGlyph({
  badge,
  size,
  className,
}: {
  badge: Badge;
  size: number;
  className?: string;
}) {
  const Glyph = ICON[badge.icon];
  return <Glyph aria-hidden size={size} className={cn("shrink-0", className)} />;
}

export function BadgePill({ badge }: { badge: Badge }) {
  return (
    <BadgeUi variant="secondary" className={cn(pillClassName, PILL_TONE[badge.tone])}>
      <BadgeGlyph badge={badge} size={12} />
      {badge.label}
    </BadgeUi>
  );
}

export function BadgeIcon({ badge }: { badge: Badge }) {
  return (
    <span
      role="img"
      aria-label={badge.label}
      className="inline-flex size-5 items-center justify-center"
    >
      <BadgeGlyph badge={badge} size={16} className={ICON_TONE[badge.tone]} />
    </span>
  );
}
