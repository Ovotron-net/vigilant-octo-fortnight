import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOpsStateSource } from "@/api/opsStateSource";
import { queryKeys } from "@/api/queryKeys";

/**
 * Poll `/api/state` (or mock adapter) via the ops state source seam.
 * Thin React glue — behaviour lives in createOpsStateSource / loadOpsConfig.
 */
export function useOpsState() {
  const source = getOpsStateSource();
  return useQuery({
    queryKey: queryKeys.opsState(source.cacheKey),
    queryFn: () => source.load(),
    refetchInterval: source.pollMs,
    refetchIntervalInBackground: false,
    staleTime: Math.min(1000, source.pollMs / 2),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
