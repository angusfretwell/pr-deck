import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToken } from "@/lib/storage";
import type { Mergeability, PullRequestList } from "@/types";

import * as realApi from "./api";
import { isRetryable } from "./api";
import { withMergeability, withRows } from "./mapping";
import * as mockApi from "./mock";
import { mergeabilityPollInterval } from "./polling";

const mockFlag: unknown = import.meta.env.VITE_MOCK;

const {
  fetchMergeability,
  fetchPullRequestDetail,
  fetchPullRequests,
  fetchSession,
} = mockFlag !== undefined && mockFlag !== "" ? mockApi : realApi;

export { fetchSession };

const retry = (failureCount: number, error: Error) =>
  isRetryable(error) && failureCount < 1;

const RETRY_DELAY_MS = 1000;

const live = {
  staleTime: 30_000,
  gcTime: Infinity,
  refetchInterval: 15 * 60_000,
  refetchOnWindowFocus: true,
  retry,
  retryDelay: RETRY_DELAY_MS,
};

export const useSession = () => {
  const [token] = useToken();

  return useQuery({
    queryKey: ["session"],
    queryFn:
      token !== null && token !== ""
        ? async () => await fetchSession(token)
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
    retry,
    retryDelay: RETRY_DELAY_MS,
  });
};

const usePendingMergeability = (
  owner: string,
  list: PullRequestList | undefined
) => {
  const [token] = useToken();
  const queryClient = useQueryClient();

  const ids =
    list?.pullRequests
      .filter((pr) => pr.mergeability === "unknown" && !pr.statusPending)
      .map((pr) => pr.id) ?? [];

  useQuery<Record<string, Mergeability>>({
    queryKey: ["mergeability", owner, ids],
    queryFn:
      token !== null && token !== "" && ids.length > 0
        ? async () => {
            const states = await fetchMergeability(token, ids);
            queryClient.setQueryData<PullRequestList>(
              ["pull-requests", owner],
              (current) => current && withMergeability(current, states)
            );

            return states;
          }
        : skipToken,
    initialData: {},
    staleTime: Infinity,
    refetchInterval: ({ state }) => mergeabilityPollInterval(state),
    retry,
    retryDelay: RETRY_DELAY_MS,
  });
};

export const usePullRequests = (owner: string) => {
  const [token] = useToken();
  const viewer = useSession().data?.viewer.login;
  const queryClient = useQueryClient();
  const queryKey = ["pull-requests", owner];

  const list = useQuery({
    queryKey,
    queryFn:
      token !== null && token !== "" && viewer !== undefined && viewer !== ""
        ? async ({ signal }) =>
            await fetchPullRequests(token, owner, viewer, (rows) => {
              if (signal.aborted) {
                return;
              }

              queryClient.setQueryData<PullRequestList>(queryKey, (current) =>
                withRows(current, rows)
              );
            })
        : skipToken,
    ...live,
  });

  usePendingMergeability(owner, list.data);

  return list;
};

export const usePullRequestDetail = (id: string) => {
  const [token] = useToken();

  return useQuery({
    queryKey: ["pull-request-detail", id],
    queryFn:
      token !== null && token !== ""
        ? async () => await fetchPullRequestDetail(token, id)
        : skipToken,
    ...live,
  });
};
