import { GraphqlResponseError } from "@octokit/graphql";
import { describe, expect, it } from "vite-plus/test";
import { errorMessage, isAuthError, isRetryable } from "./api";

const httpError = (status: number) => Object.assign(new Error("HTTP error"), { status });

const graphqlError = (type: string, message = type) =>
  new GraphqlResponseError(
    { method: "POST", url: "/graphql" },
    {},
    {
      data: {},
      errors: [{ type, message, path: [""], extensions: {}, locations: [{ line: 1, column: 1 }] }],
    },
  );

describe("isAuthError", () => {
  it("matches only an HTTP 401", () => {
    expect(isAuthError(httpError(401))).toBe(true);
    expect(isAuthError(httpError(403))).toBe(false);
    expect(isAuthError({ status: "401" })).toBe(false);
    expect(isAuthError(new Error("network down"))).toBe(false);
    expect(isAuthError(null)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("explains a rejected token", () => {
    expect(errorMessage(httpError(401))).toBe("Your GitHub token is invalid or has expired.");
  });

  it("explains permission and rate limit failures", () => {
    const refused =
      "GitHub refused the request. You may be rate limited or the token lacks access.";
    expect(errorMessage(httpError(403))).toBe(refused);
    expect(errorMessage(httpError(429))).toBe(refused);
  });

  it("reports the status of a server failure", () => {
    expect(errorMessage(httpError(502))).toBe(
      "GitHub did not respond in time (HTTP 502). Try again shortly.",
    );
  });

  it("passes on the message of a GraphQL failure", () => {
    expect(errorMessage(graphqlError("NOT_FOUND", "Could not resolve to a node."))).toBe(
      "Could not resolve to a node.",
    );
  });

  it("falls back to the error's own message", () => {
    expect(errorMessage(httpError(404))).toBe("HTTP error");
    expect(errorMessage(new Error("network down"))).toBe("network down");
  });

  it("has a generic message for anything that is not an error", () => {
    expect(errorMessage("boom")).toBe("Something went wrong talking to GitHub.");
    expect(errorMessage(null)).toBe("Something went wrong talking to GitHub.");
  });
});

describe("isRetryable", () => {
  it("does not retry auth, permission or rate limit failures", () => {
    expect(isRetryable(httpError(401))).toBe(false);
    expect(isRetryable(httpError(403))).toBe(false);
    expect(isRetryable(httpError(429))).toBe(false);
    expect(isRetryable(graphqlError("RATE_LIMITED"))).toBe(false);
  });

  it("retries server and other GraphQL failures", () => {
    expect(isRetryable(httpError(502))).toBe(true);
    expect(isRetryable(graphqlError("NOT_FOUND"))).toBe(true);
    expect(isRetryable(new Error("network down"))).toBe(true);
  });
});
