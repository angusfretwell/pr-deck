import { Check, CircleSmall, MessageSquare, X, type LucideIcon } from "lucide-react";
import { Badge as BadgeUi, type BadgeProps } from "@/components/ui/badge";
import type { Badge, BadgeIconName, Tone } from "@/lib/pr";
import { cn } from "@/lib/utils";

const VARIANT: Record<Tone, BadgeProps["variant"]> = {
  ok: "success",
  bad: "error",
  warn: "warning",
  mute: "secondary",
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
    <Icon aria-hidden strokeWidth={2.5} className={cn(badge.icon === "dot" && "fill-current")} />
  );
}

const toneClass = (tone: Tone) => tone === "mute" && "text-muted-foreground";

export function BadgePill({ badge }: { badge: Badge }) {
  return (
    <BadgeUi
      variant={VARIANT[badge.tone]}
      className={cn("rounded-full px-1.75 sm:h-5 sm:text-[11px]", toneClass(badge.tone))}
    >
      <BadgeGlyph badge={badge} />
      {badge.label}
    </BadgeUi>
  );
}

export function BadgeIcon({ badge }: { badge: Badge }) {
  return (
    <BadgeUi
      variant={VARIANT[badge.tone]}
      className={cn("rounded-full px-0", toneClass(badge.tone))}
      aria-label={badge.label}
    >
      <BadgeGlyph badge={badge} />
    </BadgeUi>
  );
}
