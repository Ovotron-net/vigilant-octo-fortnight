import type { TotalsDto } from "@/api/types";

export const TOTALS_KEYS = [
  "observations",
  "complete",
  "partial",
  "undecodable",
  "matched_observations",
  "rule_matches",
  "episodes_started",
  "episodes_progressed",
  "episodes_closed",
] as const satisfies ReadonlyArray<keyof TotalsDto>;

export type TotalsKey = (typeof TOTALS_KEYS)[number];

export type TotalsSample = {
  /** Wall-clock ms when the sample was observed (query dataUpdatedAt). */
  t: number;
  totals: TotalsDto;
};

/** Instantaneous rates (units/sec) between two consecutive samples. */
export type RateSnapshot = {
  t: number;
  /** Elapsed seconds between this sample and the previous one. */
  dtSec: number;
  rates: Record<TotalsKey, number>;
};

export const DEFAULT_HISTORY_CAP = 90;

/** Ignore rate windows shorter than this (focus + interval clustering). */
export const DEFAULT_MIN_RATE_DT_MS = 250;

/**
 * Append a sample to a ring buffer. Drops the oldest when over `cap`.
 * Ignores duplicate timestamps (same poll re-delivery).
 */
export function appendTotalsSample(
  history: readonly TotalsSample[],
  sample: TotalsSample,
  cap = DEFAULT_HISTORY_CAP,
): TotalsSample[] {
  if (history.length > 0 && history[history.length - 1]!.t === sample.t) {
    return history as TotalsSample[];
  }
  const next = history.length >= cap ? history.slice(history.length - cap + 1) : [...history];
  next.push(sample);
  return next;
}

/**
 * Per-second rates from counter deltas. Counter resets (negative delta)
 * yield 0 for that series so a sensor restart does not draw a cliff down.
 * Windows shorter than `minDtMs` are skipped (focus/interval clustering).
 */
export function rateBetween(
  prev: TotalsSample,
  curr: TotalsSample,
  minDtMs = DEFAULT_MIN_RATE_DT_MS,
): RateSnapshot | null {
  const dtMs = curr.t - prev.t;
  if (dtMs <= 0 || dtMs < minDtMs) return null;
  const dtSec = dtMs / 1000;
  const rates = {} as Record<TotalsKey, number>;
  for (const key of TOTALS_KEYS) {
    const delta = curr.totals[key] - prev.totals[key];
    rates[key] = delta < 0 ? 0 : delta / dtSec;
  }
  return { t: curr.t, dtSec, rates };
}

/**
 * A window shorter than `minDtMs` is not dropped — the prior accepted sample
 * stays the baseline until a later sample accumulates a long-enough window,
 * so clustered deltas are aggregated rather than lost.
 */
export function buildRateHistory(
  samples: readonly TotalsSample[],
  minDtMs = DEFAULT_MIN_RATE_DT_MS,
): RateSnapshot[] {
  if (samples.length < 2) return [];
  const out: RateSnapshot[] = [];
  let baseline = samples[0]!;
  for (let i = 1; i < samples.length; i++) {
    const snap = rateBetween(baseline, samples[i]!, minDtMs);
    if (snap) {
      out.push(snap);
      baseline = samples[i]!;
    }
  }
  return out;
}

export function latestRates(
  rates: readonly RateSnapshot[],
): Record<TotalsKey, number> | null {
  if (!rates.length) return null;
  return rates[rates.length - 1]!.rates;
}

export function seriesValues(
  rates: readonly RateSnapshot[],
  key: TotalsKey,
): number[] {
  return rates.map((r) => r.rates[key]);
}

/** Build an SVG polyline path for values in a fixed viewBox. */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): string {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const y = height / 2;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }
  const max = Math.max(...values, 1e-9);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1e-9);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const step = innerW / (values.length - 1);

  return values
    .map((v, i) => {
      const x = padding + i * step;
      const y = padding + innerH - ((v - min) / span) * innerH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Multi-series paths sharing the same y-scale (max across series). */
export function multiSeriesPaths(
  series: ReadonlyArray<{ key: string; values: readonly number[] }>,
  width: number,
  height: number,
  padding = 8,
): { paths: Record<string, string>; max: number } {
  const all = series.flatMap((s) => s.values);
  const max = Math.max(...all, 1e-9);
  const min = 0;
  const span = Math.max(max - min, 1e-9);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const n = Math.max(...series.map((s) => s.values.length), 0);
  const paths: Record<string, string> = {};

  for (const s of series) {
    if (s.values.length === 0) {
      paths[s.key] = "";
      continue;
    }
    if (s.values.length === 1 || n < 2) {
      const y = padding + innerH - (s.values[0]! / span) * innerH;
      paths[s.key] = `M ${padding} ${y.toFixed(2)} L ${width - padding} ${y.toFixed(2)}`;
      continue;
    }
    const step = innerW / (n - 1);
    // Align shorter series to the right (most recent).
    const offset = n - s.values.length;
    paths[s.key] = s.values
      .map((v, i) => {
        const x = padding + (i + offset) * step;
        const y = padding + innerH - ((v - min) / span) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }
  return { paths, max };
}
