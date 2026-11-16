import { Check, CircleSmall, MessageSquare, X, type LucideIcon } from "lucide-react";
import { Badge as BadgeUi } from "@/components/ui/badge";
import type { Badge, BadgeIconName, Tone } from "@/lib/pr";
import { cn } from "@/lib/utils";

export const pillClassName =
  "h-5 rounded-md bg-foreground/6 px-1.5 text-foreground/80 sm:h-5 sm:text-xs dark:bg-foreground/10";

const ICON_TONE: Record<Tone, string> = {
  ok: "text-success",
  bad: "text-destructive",
  warn: "text-warning",
  mute: "text-muted-foreground",
};

const ICON: Record<BadgeIconName, LucideIcon> = {
  check: Check,
  x: X,
  dot: CircleSmall,
  ring: CircleSmall,
  chat: MessageSquare,
};

function BadgeGlyph({ badge }: { badge: Badge }) {
  const Icon = ICON[badge.icon];
  return (
    <Icon
      aria-hidden
      strokeWidth={2.5}
      className={cn("opacity-100", ICON_TONE[badge.tone], badge.icon === "dot" && "fill-current")}
    />
  );
}

export function BadgePill({ badge }: { badge: Badge }) {
  return (
    <BadgeUi variant="secondary" className={pillClassName}>
      <BadgeGlyph badge={badge} />
      {badge.label}
    </BadgeUi>
  );
}

export function BadgeIcon({ badge }: { badge: Badge }) {
  return (
    <BadgeUi variant="secondary" className={cn(pillClassName, "w-5 px-0")} aria-label={badge.label}>
      <BadgeGlyph badge={badge} />
    </BadgeUi>
  );
}
