import { GraphqlResponseError } from "@octokit/graphql";
import { describe, expect, it } from "vite-plus/test";
import { isRetryable } from "./api";

const httpError = (status: number) => Object.assign(new Error("HTTP error"), { status });

const graphqlError = (type: string) =>
  new GraphqlResponseError(
    { method: "POST", url: "/graphql" },
    {},
    {
      data: {},
      errors: [
        { type, message: type, path: [""], extensions: {}, locations: [{ line: 1, column: 1 }] },
      ],
    },
  );

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
