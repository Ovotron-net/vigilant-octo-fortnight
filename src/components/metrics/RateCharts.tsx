import { useMemo } from "react";
import type { RateSnapshot, TotalsKey } from "@/lib/rates";
import { multiSeriesPaths, seriesValues } from "@/lib/rates";
import { formatRate } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const CHART_W = 640;
const CHART_H = 160;

export type RateSeriesDef = {
  key: TotalsKey;
  label: string;
  color: string;
};

export const PRIMARY_RATE_SERIES: RateSeriesDef[] = [
  { key: "observations", label: "Observations", color: "var(--chart-1)" },
  { key: "matched_observations", label: "Matched", color: "var(--chart-2)" },
  { key: "rule_matches", label: "Rule matches", color: "var(--chart-3)" },
];

export const EPISODE_RATE_SERIES: RateSeriesDef[] = [
  { key: "episodes_started", label: "Started", color: "var(--chart-2)" },
  { key: "episodes_progressed", label: "Progressed", color: "var(--chart-4)" },
  { key: "episodes_closed", label: "Closed", color: "var(--chart-5)" },
];

function MultiLineChart({
  rates,
  series,
  title,
}: {
  rates: readonly RateSnapshot[];
  series: RateSeriesDef[];
  title: string;
}) {
  const { paths, max, last } = useMemo(() => {
    const defs = series.map((s) => ({
      key: s.key,
      values: seriesValues(rates, s.key),
    }));
    const { paths, max } = multiSeriesPaths(defs, CHART_W, CHART_H);
    const lastSnap = rates[rates.length - 1];
    const last = lastSnap
      ? Object.fromEntries(
          series.map((s) => [s.key, lastSnap.rates[s.key]] as const),
        )
      : null;
    return { paths, max, last };
  }, [rates, series]);

  if (rates.length === 0) {
    return (
      <div className="chart-card bezel">
        <div className="bezel__core">
          <div className="chart-card__head">
            <h3>{title}</h3>
            <span className="chart-card__hint">Waiting for second sample…</span>
          </div>
          <div className="chart-empty">
            Rates appear after two successful polls.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card bezel">
      <div className="bezel__core">
        <div className="chart-card__head">
          <h3>{title}</h3>
          <span className="chart-card__hint">
            peak {formatRate(max)} · {rates.length} samples
          </span>
        </div>
        <ul className="chart-legend">
          {series.map((s) => (
            <li key={s.key} style={{ color: s.color }}>
              <span
                className="chart-legend__swatch"
                style={{ background: s.color }}
              />
              {s.label}
              <strong>{last ? formatRate(last[s.key] ?? 0) : "—"}</strong>
            </li>
          ))}
        </ul>
        <div className="chart-svg-wrap">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="chart-svg"
            role="img"
            aria-label={`${title} rate chart`}
            preserveAspectRatio="none"
          >
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={8}
                x2={CHART_W - 8}
                y1={8 + (CHART_H - 16) * (1 - f)}
                y2={8 + (CHART_H - 16) * (1 - f)}
                className="chart-grid"
              />
            ))}
            {series.map((s) =>
              paths[s.key] ? (
                <path
                  key={s.key}
                  d={paths[s.key]}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export function RateCharts({ rates }: { rates: readonly RateSnapshot[] }) {
  return (
    <div className="rate-charts">
      <MultiLineChart
        rates={rates}
        series={PRIMARY_RATE_SERIES}
        title="Traffic rates"
      />
      <MultiLineChart
        rates={rates}
        series={EPISODE_RATE_SERIES}
        title="Episode rates"
      />
    </div>
  );
}

/** Compact sparkline strip used inside metric cards. */
export function RateSparkline({
  rates,
  metric,
  label,
}: {
  rates: readonly RateSnapshot[];
  metric: TotalsKey;
  label: string;
}) {
  const values = useMemo(() => seriesValues(rates, metric), [rates, metric]);
  return <Sparkline values={values} label={`${label} rate`} width={112} height={32} />;
}
