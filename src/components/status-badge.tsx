import {
  AlertFillIcon,
  CheckCircleFillIcon,
  CircleIcon,
  CommentIcon,
  DotFillIcon,
  CodeReviewIcon,
  SkipIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";
import type { Icon } from "@primer/octicons-react";

import { Badge as BadgeUi } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
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
  pending: DotFillIcon,
  ring: SkipIcon,
  open: CircleIcon,
  review: CodeReviewIcon,
  chat: CommentIcon,
  alert: AlertFillIcon,
};

const ROUND_ICONS = new Set<BadgeIconName>(["pass", "fail", "pending"]);

export const BadgePill = ({ badge }: { badge: Badge }) => {
  const Glyph = ICON[badge.icon];

  return (
    <BadgeUi variant={PILL_VARIANT[badge.tone]} className="font-[450]">
      <Glyph
        aria-hidden
        className={ROUND_ICONS.has(badge.icon) ? "-ms-1" : "-ms-0.5"}
      />
      {badge.label}
    </BadgeUi>
  );
};

export const BadgeIcon = ({
  badge,
  className,
}: {
  badge: Badge;
  className?: string;
}) => {
  const Glyph = ICON[badge.icon];

  return (
    <span className="inline-flex size-5 items-center justify-center">
      <Glyph
        aria-label={badge.label}
        className={cn("size-4", ICON_TONE[badge.tone], className)}
      />
    </span>
  );
};
