import { useState } from "react";

import { BadgeIcon } from "@/components/status-badge";
import { CHECK_BADGE } from "@/lib/pr";
import type { Check } from "@/types";

import { usePreviewDetail } from "./detail";
import { Line, Lines, Section, ShowMore, SkeletonLines } from "./primitives";

const CHECK_STATE_ORDER: Record<Check["state"], number> = {
  fail: 0,
  pending: 1,
  pass: 2,
  skipped: 3,
};

function duration(check: Check) {
  if (check.state === "pending") {
    return "running";
  }

  if (check.seconds === null || check.state === "skipped") {
    return null;
  }

  const minutes = Math.floor(check.seconds / 60);
  const seconds = check.seconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function CheckList({ checks }: { checks: Check[] }) {
  const [expanded, setExpanded] = useState(false);

  const sorted = checks.toSorted(
    (a, b) => CHECK_STATE_ORDER[a.state] - CHECK_STATE_ORDER[b.state]
  );

  const required = sorted.filter((check) => check.required);
  const shown = expanded || required.length === 0 ? sorted : required;

  return (
    <Lines>
      {checks.length === 0 && (
        <Line>
          <span className="text-muted-foreground">No checks.</span>
        </Line>
      )}
      {shown.map((check) => (
        <Line key={check.name}>
          <BadgeIcon badge={CHECK_BADGE[check.state]} />
          <span className="min-w-0 flex-1 truncate">
            {check.url !== null && check.url !== "" ? (
              <a
                href={check.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {check.name}
              </a>
            ) : (
              check.name
            )}
          </span>
          <span className="text-muted-foreground/72 tabular-nums">
            {duration(check)}
          </span>
        </Line>
      ))}
      {shown.length < checks.length && (
        <ShowMore
          onClick={() => {
            setExpanded(true);
          }}
        >
          Show {checks.length - shown.length} more
        </ShowMore>
      )}
    </Lines>
  );
}

export function PreviewChecks() {
  const query = usePreviewDetail();

  if (query.isError) {
    return null;
  }

  return (
    <Section title="Checks">
      {query.data ? (
        <CheckList checks={query.data.checks} />
      ) : (
        <SkeletonLines />
      )}
    </Section>
  );
}
