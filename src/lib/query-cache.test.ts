import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";
import { shouldPersistQuery } from "./query-cache";

const queryFor = (client: QueryClient, queryKey: unknown[]) =>
  client.getQueryCache().find({ queryKey, exact: true })!;

describe("shouldPersistQuery", () => {
  it("persists the session and pull request lists", () => {
    const client = new QueryClient();
    client.setQueryData(["session"], {});
    client.setQueryData(["pull-requests", "acme"], {});
    expect(shouldPersistQuery(queryFor(client, ["session"]))).toBe(true);
    expect(shouldPersistQuery(queryFor(client, ["pull-requests", "acme"]))).toBe(true);
  });

  it("skips pull request details and mergeability polls", () => {
    const client = new QueryClient();
    client.setQueryData(["pull-request-detail", "PR_1"], {});
    client.setQueryData(["mergeability", "acme", ["PR_1"]], {});
    expect(shouldPersistQuery(queryFor(client, ["pull-request-detail", "PR_1"]))).toBe(false);
    expect(shouldPersistQuery(queryFor(client, ["mergeability", "acme", ["PR_1"]]))).toBe(false);
  });

  it("skips pending and errored queries", async () => {
    const client = new QueryClient();
    client.getQueryCache().build(client, { queryKey: ["session"] });
    expect(shouldPersistQuery(queryFor(client, ["session"]))).toBe(false);

    await client
      .fetchQuery({
        queryKey: ["pull-requests", "acme"],
        queryFn: () => Promise.reject(new Error()),
      })
      .catch(() => {});
    expect(shouldPersistQuery(queryFor(client, ["pull-requests", "acme"]))).toBe(false);
  });
});
