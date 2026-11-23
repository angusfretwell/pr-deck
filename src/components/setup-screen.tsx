import { EyeIcon, KeyIcon, MarkGithubIcon } from "@primer/octicons-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { SetupPreview } from "@/components/setup-preview";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { errorMessage } from "@/github/api";
import { fetchSession } from "@/github/hooks";
import { REPO_URL } from "@/lib/repo";
import { cn } from "@/lib/utils";
import type { Session } from "@/types";

const NEW_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,read:org&description=PR%20Deck";

const PROMISES = [
  { icon: EyeIcon, text: "Read-only, never writes to GitHub" },
  {
    icon: KeyIcon,
    text: "Token is stored in your browser, and only sent to GitHub",
  },
] as const;

interface SetupScreenProps {
  initialError: string | null;
  onSignIn: (token: string, session: Session) => void;
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-6">
      <rect width="32" height="32" rx="7" className="fill-foreground" />
      <rect
        x="7"
        y="7"
        width="18"
        height="10.5"
        rx="2.5"
        className="fill-background"
      />
      <g
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="stroke-background"
      >
        <path d="M10 21.3h12" opacity=".6" />
        <path d="M13 25h6" opacity=".3" />
      </g>
    </svg>
  );
}

export function SetupScreen({ initialError, onSignIn }: SetupScreenProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [failures, setFailures] = useState(0);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = token.trim();
    setPending(true);
    setError(null);

    try {
      onSignIn(trimmed, await fetchSession(trimmed));
    } catch (error_) {
      setError(errorMessage(error_));
      setFailures((count) => count + 1);
      setPending(false);
    }
  }

  return (
    <main className="grid flex-1 md:min-h-0 md:overflow-y-auto lg:grid-cols-[minmax(360px,420px)_1fr]">
      <section className="flex flex-col px-6 pt-12 pb-[calc(--spacing(12)+env(safe-area-inset-bottom))] sm:px-12 lg:px-10">
        <div className="mx-auto my-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Logo />
            PR Deck
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Every open pull request across your orgs, on one screen.
          </h1>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              void submit(event);
            }}
          >
            <Field invalid={error !== null}>
              <FieldLabel>Personal access token</FieldLabel>
              <Input
                type="password"
                size="lg"
                className={cn(
                  "motion-reduce:animate-none",
                  token && "tracking-[0.25em]",
                  failures > 0 &&
                    (failures % 2
                      ? "animate-toast-error-odd"
                      : "animate-toast-error-even")
                )}
                autoComplete="off"
                spellCheck={false}
                autoFocus
                placeholder="ghp_…"
                value={token}
                onChange={(event) => {
                  setToken(event.target.value);
                  setError(null);
                }}
              />
              <FieldDescription>
                No token yet?{" "}
                <a
                  className="text-foreground underline underline-offset-4"
                  href={NEW_TOKEN_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Create one with <code>repo</code> and <code>read:org</code>
                </a>
              </FieldDescription>
              <div className="min-h-4">
                {error !== null && error !== "" && (
                  <FieldError match>{error}</FieldError>
                )}
              </div>
            </Field>
            <Button
              type="submit"
              size="lg"
              loading={pending}
              disabled={!token.trim()}
            >
              Connect GitHub
            </Button>
          </form>
          <div className="flex flex-col gap-6">
            <Separator />
            <ul className="text-muted-foreground flex flex-col gap-3 text-xs">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-2">
                  <Icon className="mt-px size-3.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer className="text-muted-foreground mx-auto w-full max-w-sm pt-8 text-xs">
          <a
            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors duration-150 ease-out"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <MarkGithubIcon className="size-3.5" />
            Source on GitHub
          </a>
        </footer>
      </section>
      <section className="bg-sidebar relative hidden overflow-hidden border-s lg:block">
        <div className="animate-rise absolute start-12 -end-48 top-[16%] bottom-0 overflow-hidden rounded-ss-xl border-s border-t mask-b-from-45% mask-b-to-85% shadow-lg/5 motion-reduce:animate-none min-[1800px]:end-0">
          <SetupPreview className="h-full min-w-180" />
        </div>
      </section>
    </main>
  );
}
