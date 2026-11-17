import { EyeIcon, KeyIcon, MarkGithubIcon } from "@primer/octicons-react";
import { useState, type FormEvent } from "react";
import { SetupPreview } from "@/components/setup-preview";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
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
  { icon: KeyIcon, text: "Token is stored in your browser, and only sent to GitHub" },
] as const;

interface SetupScreenProps {
  initialError: string | null;
  onSignIn: (token: string, session: Session) => void;
}

export function SetupScreen({ initialError, onSignIn }: SetupScreenProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [failures, setFailures] = useState(0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    setPending(true);
    setError(null);
    try {
      onSignIn(trimmed, await fetchSession(trimmed));
    } catch (failure) {
      setError(errorMessage(failure));
      setFailures((count) => count + 1);
      setPending(false);
    }
  };

  return (
    <main className="grid flex-1 md:min-h-0 md:overflow-y-auto lg:grid-cols-[minmax(360px,420px)_1fr]">
      <section className="flex flex-col px-6 pt-12 pb-[calc(--spacing(12)+env(safe-area-inset-bottom))] sm:px-12 lg:px-10">
        <div className="mx-auto my-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Logo />
            PR Deck
          </div>
          <h1 className="text-balance font-semibold text-2xl tracking-tight">
            Every open pull request across your orgs, on one screen.
          </h1>
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <Field invalid={error !== null}>
              <FieldLabel>Personal access token</FieldLabel>
              <Input
                type="password"
                size="lg"
                className={cn(
                  "motion-reduce:animate-none",
                  token && "tracking-[0.25em]",
                  failures > 0 &&
                    (failures % 2 ? "animate-toast-error-odd" : "animate-toast-error-even"),
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
              <div className="min-h-4">{error && <FieldError match>{error}</FieldError>}</div>
            </Field>
            <Button type="submit" size="lg" loading={pending} disabled={!token.trim()}>
              Connect GitHub
            </Button>
          </form>
          <div className="flex flex-col gap-6">
            <Separator />
            <ul className="flex flex-col gap-3 text-muted-foreground text-xs">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-2">
                  <Icon className="mt-px size-3.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer className="mx-auto w-full max-w-sm pt-8 text-muted-foreground text-xs">
          <a
            className="inline-flex items-center gap-1.5 transition-colors duration-150 ease-out hover:text-foreground"
            href={REPO_URL}
            target="_blank"
            rel="noopener"
          >
            <MarkGithubIcon className="size-3.5" />
            Source on GitHub
          </a>
        </footer>
      </section>
      <section className="relative hidden overflow-hidden border-s bg-sidebar lg:block">
        <div className="absolute top-[16%] -end-48 bottom-0 start-12 min-[1800px]:end-12 animate-rise overflow-hidden rounded-ss-xl border-t border-s shadow-lg/5 mask-b-from-45% mask-b-to-85% motion-reduce:animate-none">
          <SetupPreview className="h-full min-w-180" />
        </div>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-6">
      <rect width="32" height="32" rx="7" className="fill-foreground" />
      <rect x="7" y="7" width="18" height="10.5" rx="2.5" className="fill-background" />
      <g fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-background">
        <path d="M10 21.3h12" opacity=".6" />
        <path d="M13 25h6" opacity=".3" />
      </g>
    </svg>
  );
}
