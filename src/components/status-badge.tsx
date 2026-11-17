import {
  AlertIcon,
  CheckCircleFillIcon,
  CheckIcon,
  CircleIcon,
  CommentIcon,
  DotFillIcon,
  CodeReviewIcon,
  SkipIcon,
  XCircleFillIcon,
  XCircleIcon,
  type Icon,
} from "@primer/octicons-react";
import { Badge as BadgeUi, type BadgeProps } from "@/components/ui/badge";
import type { Badge, BadgeIconName, Tone } from "@/lib/pr";
import { cn } from "@/lib/utils";

const ICON_TONE: Record<Tone, string> = {
  ok: "text-success-foreground",
  bad: "text-destructive-foreground",
  severe: "text-severe-foreground",
  warn: "text-warning-foreground",
  mute: "text-muted-foreground",
};

const PILL_VARIANT: Record<Tone, BadgeProps["variant"]> = {
  ok: "success",
  bad: "error",
  severe: "severe",
  warn: "warning",
  mute: "secondary",
};

const ICON: Record<BadgeIconName, Icon> = {
  pass: CheckCircleFillIcon,
  fail: XCircleFillIcon,
  failOutline: XCircleIcon,
  pending: DotFillIcon,
  ring: SkipIcon,
  open: CircleIcon,
  check: CheckIcon,
  review: CodeReviewIcon,
  chat: CommentIcon,
  alert: AlertIcon,
};

export function BadgePill({ badge }: { badge: Badge }) {
  const Glyph = ICON[badge.icon];
  return (
    <BadgeUi variant={PILL_VARIANT[badge.tone]}>
      <Glyph aria-hidden />
      {badge.label}
    </BadgeUi>
  );
}

export function BadgeIcon({ badge, className }: { badge: Badge; className?: string }) {
  const Glyph = ICON[badge.icon];
  return (
    <span
      role="img"
      aria-label={badge.label}
      className="inline-flex size-5 items-center justify-center"
    >
      <Glyph aria-hidden className={cn("size-4", ICON_TONE[badge.tone], className)} />
    </span>
  );
}
