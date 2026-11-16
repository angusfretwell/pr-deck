import { QueryClient, QueryObserver, environmentManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { isRetryable } from "./api";
import { mergeabilityPollInterval } from "./polling";

const httpError = (status: number) => Object.assign(new Error("HTTP error"), { status });

describe("mergeabilityPollInterval", () => {
  const interval = (dataUpdateCount: number, errorUpdateCount: number) =>
    mergeabilityPollInterval({ dataUpdateCount, errorUpdateCount });

  it("doubles after each successful poll and stops after the fourth", () => {
    expect([0, 1, 2, 3, 4, 5].map((successes) => interval(successes, 0))).toEqual([
      10_000,
      20_000,
      40_000,
      80_000,
      false,
      false,
    ]);
  });

  it("counts failed polls as attempts", () => {
    expect([0, 1, 2, 3, 4, 5].map((failures) => interval(0, failures))).toEqual([
      10_000,
      20_000,
      40_000,
      80_000,
      false,
      false,
    ]);
    expect(interval(2, 1)).toBe(80_000);
    expect(interval(2, 2)).toBe(false);
  });
});

describe("mergeability polling through a query observer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    environmentManager.setIsServer(() => false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function startPolling(failure: (fetchNumber: number) => Error | null, ids = ["a"]) {
    const client = new QueryClient();
    const startedAt = Date.now();
    const seconds: number[] = [];
    const options = (queryIds: string[]) => ({
      queryKey: ["mergeability", "acme", queryIds],
      queryFn: async () => {
        seconds.push((Date.now() - startedAt) / 1000);
        const error = failure(seconds.length);
        if (error) throw error;
        return {};
      },
      initialData: {},
      staleTime: Infinity,
      refetchInterval: ({ state }: { state: Parameters<typeof mergeabilityPollInterval>[0] }) =>
        mergeabilityPollInterval(state),
      retry: (failureCount: number, error: Error) => isRetryable(error) && failureCount < 1,
      retryDelay: 1000,
    });
    const observer = new QueryObserver(client, options(ids));
    const unsubscribe = observer.subscribe(() => {});
    return {
      seconds,
      advance: (ms: number) => vi.advanceTimersByTimeAsync(ms),
      setIds: (next: string[]) => observer.setOptions(options(next)),
      stop: () => {
        unsubscribe();
        client.clear();
      },
    };
  }

  it("polls at 10, 30, 70 and 150 seconds and then stops", async () => {
    const poll = startPolling(() => null);
    await poll.advance(600_000);
    expect(poll.seconds).toEqual([10, 30, 70, 150]);
    poll.stop();
  });

  it("backs off and stops on the same schedule when every poll is rate limited", async () => {
    const poll = startPolling(() => httpError(429));
    await poll.advance(600_000);
    expect(poll.seconds).toEqual([10, 30, 70, 150]);
    poll.stop();
  });

  it("retries a server error once per poll and still stops after four polls", async () => {
    const poll = startPolling(() => httpError(502));
    await poll.advance(600_000);
    expect(poll.seconds).toEqual([10, 11, 31, 32, 72, 73, 153, 154]);
    poll.stop();
  });

  it("keeps backing off when polls start failing after two successes", async () => {
    const poll = startPolling((fetchNumber) => (fetchNumber > 2 ? httpError(429) : null));
    await poll.advance(600_000);
    expect(poll.seconds).toEqual([10, 30, 70, 150]);
    poll.stop();
  });

  it("restarts the backoff when the set of unknown ids changes", async () => {
    const poll = startPolling(() => null, ["a", "b"]);
    await poll.advance(35_000);
    expect(poll.seconds).toEqual([10, 30]);
    poll.setIds(["b"]);
    await poll.advance(600_000);
    expect(poll.seconds).toEqual([10, 30, 45, 65, 105, 185]);
    poll.stop();
  });
});
