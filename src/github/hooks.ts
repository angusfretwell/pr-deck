import { skipToken, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useToken } from "@/lib/storage";
import type { PullRequestDetail, PullRequestList, Session } from "@/types";
import {
  fetchOpenCount,
  fetchPullRequestDetail,
  fetchPullRequests,
  fetchSession,
  isAuthError,
} from "./api";

const retry = (failureCount: number, error: Error) => !isAuthError(error) && failureCount < 3;

const MERGEABILITY_PENDING_REFETCH_MS = 10_000;

const live = {
  staleTime: 30_000,
  gcTime: Infinity,
  refetchInterval: 120_000,
  refetchOnWindowFocus: true,
  retry,
};

export function useSession(): UseQueryResult<Session> {
  const [token] = useToken();
  return useQuery({
    queryKey: ["session"],
    queryFn: token ? () => fetchSession(token) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
    retry,
  });
}

export function usePullRequests(owner: string): UseQueryResult<PullRequestList> {
  const [token] = useToken();
  const viewer = useSession().data?.viewer.login;
  return useQuery({
    queryKey: ["pull-requests", owner],
    queryFn: token && viewer ? () => fetchPullRequests(token, owner, viewer) : skipToken,
    ...live,
    refetchInterval: ({ state }) =>
      state.data?.pullRequests.some((pr) => pr.mergeability === "unknown")
        ? MERGEABILITY_PENDING_REFETCH_MS
        : live.refetchInterval,
  });
}

export function useOpenCount(owner: string, enabled: boolean): UseQueryResult<number> {
  const [token] = useToken();
  return useQuery({
    queryKey: ["open-count", owner],
    queryFn: token && enabled ? () => fetchOpenCount(token, owner) : skipToken,
    ...live,
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
