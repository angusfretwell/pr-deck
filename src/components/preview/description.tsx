import { ChevronDownIcon } from "@primer/octicons-react";
import parse, {
  attributesToProps,
  domToReact,
  Element,
} from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import { useMemo, useRef, useState } from "react";
import { useResizeObserver } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine,
} from "@/components/ui/code-block";
import { Skeleton } from "@/components/ui/skeleton";
import { useHighlightedCode } from "@/lib/use-highlighted-code";
import { cn } from "@/lib/utils";

import { LoadError, usePreviewDetail } from "./detail";
import { Section } from "./primitives";

const DESCRIPTION_MAX_HEIGHT = 300;
const GITHUB_LANGUAGE = /\bhighlight-(?:source|text)-(?<language>\S+)/u;

function FencedCode({ code, language }: { code: string; language: string }) {
  const lines = useHighlightedCode(code, language);

  return (
    <CodeBlock size="sm" className="[li>&]:mt-2">
      <CodeBlockActions>
        <CodeBlockCopyButton value={code} />
      </CodeBlockActions>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}

function isDOMNode(node: { type: string }): node is DOMNode {
  return node.type !== "cdata" && node.type !== "root";
}

const descriptionOptions: HTMLReactParserOptions = {
  replace(node) {
    if (!(node instanceof Element)) {
      return null;
    }

    const code = node.attribs["data-snippet-clipboard-copy-content"];

    if (code !== undefined) {
      const language =
        GITHUB_LANGUAGE.exec(node.attribs.class)?.groups?.language ?? "";

      return <FencedCode code={code} language={language} />;
    }

    if (node.name === "table") {
      return (
        <div className="typeset-scroll">
          <table {...attributesToProps(node.attribs)}>
            {domToReact(node.children.filter(isDOMNode), descriptionOptions)}
          </table>
        </div>
      );
    }

    if (node.name === "a" && node.attribs.href) {
      return (
        <a
          {...attributesToProps(node.attribs)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {domToReact(node.children.filter(isDOMNode), descriptionOptions)}
        </a>
      );
    }

    return null;
  },
};

function Description({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { height = 0 } = useResizeObserver({ ref });
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && height > DESCRIPTION_MAX_HEIGHT * 1.2;
  const content = useMemo(() => parse(html, descriptionOptions), [html]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          collapsed && "h-75 overflow-hidden mask-b-from-80%",
          expanded &&
            "ease-snappy overflow-hidden transition-[height] duration-250 [interpolate-size:allow-keywords] motion-reduce:transition-none"
        )}
      >
        <div
          ref={ref}
          className="typeset [--typeset-flow:1em] [--typeset-leading:1.6] [--typeset-size:var(--text-sm)]"
        >
          {content}
        </div>
      </div>
      {collapsed && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => {
            setExpanded(true);
          }}
        >
          <ChevronDownIcon />
          Show more
        </Button>
      )}
    </div>
  );
}

function DescriptionSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  );
}

export function PreviewDescription() {
  const query = usePreviewDetail();

  if (query.isError) {
    return <LoadError />;
  }

  function content() {
    if (!query.data) {
      return <DescriptionSkeleton />;
    }

    return query.data.bodyHtml ? (
      <Description html={query.data.bodyHtml} />
    ) : (
      <p className="text-muted-foreground">No description.</p>
    );
  }

  return <Section title="Description">{content()}</Section>;
}
