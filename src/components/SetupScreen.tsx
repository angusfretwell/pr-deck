import { CircleAlertIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage, fetchSession } from "@/github/api";
import type { Session } from "@/types";

const NEW_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,read:org&description=PR%20Deck";

interface SetupScreenProps {
  initialError: string | null;
  onSignIn: (token: string, session: Session) => void;
}

export function SetupScreen({ initialError, onSignIn }: SetupScreenProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    setPending(true);
    setError(null);
    try {
      onSignIn(trimmed, await fetchSession(trimmed));
    } catch (failure) {
      setError(errorMessage(failure));
      setPending(false);
    }
  };

  return (
    <main className="grid flex-1 place-items-center overflow-y-auto p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PR Deck</CardTitle>
          <CardDescription>
            A read-only dashboard for reviewing the open pull requests across your GitHub account
            and organizations.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {error && (
              <Alert variant="error">
                <CircleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel>GitHub personal access token</FieldLabel>
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                autoFocus
                placeholder="ghp_…"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
              <FieldDescription>
                Use a{" "}
                <a
                  className="text-foreground underline underline-offset-4"
                  href={NEW_TOKEN_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  classic token with the <code>repo</code> and <code>read:org</code> scopes
                </a>
                . It is stored only in this browser's localStorage.
              </FieldDescription>
            </Field>
            <Button type="submit" loading={pending} disabled={!token.trim()}>
              Continue
            </Button>
          </form>
        </CardPanel>
      </Card>
    </main>
  );
}
