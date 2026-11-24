import { useState } from "react";

import { cn } from "@/lib/utils";
import type { FileChange } from "@/types";

import { usePreviewDetail } from "./detail";
import { Line, Lines, Section, ShowMore, SkeletonLines } from "./primitives";

const DIFF_SQUARES = 5;
const PREVIEWED_FILES = 5;

export function LineCounts({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <>
      <span className="text-success-foreground">
        +{additions.toLocaleString()}
      </span>{" "}
      <span className="text-destructive-foreground">
        −{deletions.toLocaleString()}
      </span>
    </>
  );
}

function DiffBar({ file }: { file: FileChange }) {
  const added = Math.round(
    (file.additions / (file.additions + file.deletions || 1)) * DIFF_SQUARES
  );

  return (
    <span className="inline-flex shrink-0 gap-px">
      {Array.from({ length: DIFF_SQUARES }, (_, i) => (
        <i
          key={i}
          className={cn(
            "size-1.5 rounded-xs",
            i < added ? "bg-success" : "bg-destructive"
          )}
        />
      ))}
    </span>
  );
}

function linesChanged(file: FileChange) {
  return file.additions + file.deletions;
}

function FilePath({ path }: { path: string }) {
  const split = path.lastIndexOf("/") + 1;

  return (
    <span
      title={path}
      className="flex min-w-0 flex-1 font-mono text-sm sm:text-xs"
    >
      <span className="truncate">{path.slice(0, split)}</span>
      <span className="max-w-full shrink-0 truncate">{path.slice(split)}</span>
    </span>
  );
}

function FileList({
  files,
  changedFiles,
}: {
  files: FileChange[];
  changedFiles: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = files.toSorted((a, b) => linesChanged(b) - linesChanged(a));
  const shown = expanded ? sorted : sorted.slice(0, PREVIEWED_FILES);

  return (
    <Lines>
      {files.length === 0 && (
        <Line>
          <span className="text-muted-foreground">No files changed.</span>
        </Line>
      )}
      {shown.map((file) => (
        <Line key={file.path}>
          <FilePath path={file.path} />
          <span className="shrink-0">
            <LineCounts additions={file.additions} deletions={file.deletions} />
          </span>
          <DiffBar file={file} />
        </Line>
      ))}
      {shown.length < files.length ? (
        <ShowMore
          onClick={() => {
            setExpanded(true);
          }}
        >
          Show {(files.length - shown.length).toLocaleString()} more
        </ShowMore>
      ) : (
        changedFiles > files.length && (
          <Line>
            <span className="text-muted-foreground">
              and {(changedFiles - files.length).toLocaleString()} more
            </span>
          </Line>
        )
      )}
    </Lines>
  );
}

export function PreviewFiles() {
  const query = usePreviewDetail();

  if (query.isError) {
    return null;
  }

  return (
    <Section
      title={`Files changed${query.data ? ` · ${query.data.changedFiles.toLocaleString()}` : ""}`}
    >
      {query.data ? (
        <FileList
          files={query.data.files}
          changedFiles={query.data.changedFiles}
        />
      ) : (
        <SkeletonLines />
      )}
    </Section>
  );
}
