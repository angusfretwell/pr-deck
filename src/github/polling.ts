const MERGEABILITY_POLL_MS = 10_000;
const MERGEABILITY_POLL_ATTEMPTS = 4;

export function mergeabilityPollInterval(state: {
  dataUpdateCount: number;
  errorUpdateCount: number;
}) {
  const attempts = state.dataUpdateCount + state.errorUpdateCount;

  return attempts < MERGEABILITY_POLL_ATTEMPTS
    ? MERGEABILITY_POLL_MS * 2 ** attempts
    : false;
}
