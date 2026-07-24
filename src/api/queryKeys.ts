export const queryKeys = {
  /** `cacheKey` is OpsStateSource.cacheKey (mode + baseUrl). */
  opsState: (cacheKey: string) => ["opsState", cacheKey] as const,
};
