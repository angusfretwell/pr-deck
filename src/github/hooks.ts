import { skipToken, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useToken } from "@/lib/storage";
import type { Mergeability, PullRequestDetail, PullRequestList, Session } from "@/types";
import {
  fetchMergeability,
  fetchPullRequestDetail,
  fetchPullRequests,
  fetchSession,
  isRetryable,
} from "./api";
import { withMergeability } from "./mapping";

const retry = (failureCount: number, error: Error) => isRetryable(error) && failureCount < 1;
const RETRY_DELAY_MS = 1000;

const MERGEABILITY_POLL_MS = 10_000;
const MERGEABILITY_POLL_ATTEMPTS = 4;

const live = {
  staleTime: 30_000,
  gcTime: Infinity,
  refetchInterval: 15 * 60_000,
  refetchOnWindowFocus: true,
  retry,
  retryDelay: RETRY_DELAY_MS,
};

export function useSession(): UseQueryResult<Session> {
  const [token] = useToken();
  return useQuery({
    queryKey: ["session"],
    queryFn: token ? () => fetchSession(token) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
    retry,
    retryDelay: RETRY_DELAY_MS,
  });
}

export function usePullRequests(owner: string): UseQueryResult<PullRequestList> {
  const [token] = useToken();
  const viewer = useSession().data?.viewer.login;
  const list = useQuery({
    queryKey: ["pull-requests", owner],
    queryFn: token && viewer ? () => fetchPullRequests(token, owner, viewer) : skipToken,
    ...live,
  });
  usePendingMergeability(owner, list.data);
  return list;
}

function usePendingMergeability(owner: string, list: PullRequestList | undefined) {
  const [token] = useToken();
  const queryClient = useQueryClient();
  const ids =
    list?.pullRequests.filter((pr) => pr.mergeability === "unknown").map((pr) => pr.id) ?? [];
  useQuery<Record<string, Mergeability>>({
    queryKey: ["mergeability", owner, ids],
    queryFn:
      token && ids.length > 0
        ? async () => {
            const states = await fetchMergeability(token, ids);
            queryClient.setQueryData<PullRequestList>(
              ["pull-requests", owner],
              (current) => current && withMergeability(current, states),
            );
            return states;
          }
        : skipToken,
    initialData: {},
    staleTime: Infinity,
    refetchInterval: ({ state }) =>
      state.dataUpdateCount < MERGEABILITY_POLL_ATTEMPTS
        ? MERGEABILITY_POLL_MS * 2 ** state.dataUpdateCount
        : false,
    retry,
    retryDelay: RETRY_DELAY_MS,
  });
}

export function usePullRequestDetail(id: string): UseQueryResult<PullRequestDetail> {
  const [token] = useToken();
  return useQuery({
    queryKey: ["pull-request-detail", id],
    queryFn: token ? () => fetchPullRequestDetail(token, id) : skipToken,
    ...live,
  });
}
