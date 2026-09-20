import { useEffect, useMemo, useState } from "react";
import type { TotalsDto } from "@/api/types";
import { getOpsStateSource } from "@/api/opsStateSource";
import {
  DEFAULT_HISTORY_CAP,
  appendTotalsSample,
  buildRateHistory,
  latestRates,
  type RateSnapshot,
  type TotalsSample,
} from "@/lib/rates";

export type TotalsHistory = {
  samples: TotalsSample[];
  rates: RateSnapshot[];
  currentRates: ReturnType<typeof latestRates>;
  ready: boolean;
};

/**
 * Ring-buffer of totals snapshots keyed by query `dataUpdatedAt`.
 * Derives per-second rates between consecutive successful polls.
 * `minDtMs` defaults to half the configured poll interval so focus
 * refetches clustered with the interval do not spike rates.
 */
export function useTotalsHistory(
  totals: TotalsDto | undefined,
  dataUpdatedAt: number,
  cap = DEFAULT_HISTORY_CAP,
  minDtMs?: number,
): TotalsHistory {
  const [samples, setSamples] = useState<TotalsSample[]>([]);
  const resolvedMinDt =
    minDtMs ?? Math.max(250, Math.floor(getOpsStateSource().pollMs / 2));

  useEffect(() => {
    if (!totals || !dataUpdatedAt) return;
    setSamples((prev) =>
      appendTotalsSample(prev, { t: dataUpdatedAt, totals }, cap),
    );
  }, [totals, dataUpdatedAt, cap]);

  return useMemo(() => {
    const rates = buildRateHistory(samples, resolvedMinDt);
    return {
      samples,
      rates,
      currentRates: latestRates(rates),
      ready: rates.length > 0,
    };
  }, [samples, resolvedMinDt]);
}
