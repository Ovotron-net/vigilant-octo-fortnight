import type { ReactNode } from "react";
import type { OperationalDto, TotalsDto } from "@/api/types";
import type { RateSnapshot, TotalsKey } from "@/lib/rates";
import { formatNumber, formatRate } from "@/lib/format";
import { RateSparkline } from "./RateCharts";

const COUNTERS: Array<[TotalsKey, string]> = [
  ["observations", "Observations"],
  ["matched_observations", "Matched"],
  ["rule_matches", "Rule matches"],
  ["episodes_started", "Episodes started"],
  ["episodes_closed", "Episodes closed"],
  ["complete", "Complete"],
  ["partial", "Partial"],
  ["undecodable", "Undecodable"],
];

function MetricBezel({
  label,
  rate,
  value,
  spark,
}: {
  label: string;
  rate?: number | null;
  value: string;
  spark?: ReactNode;
}) {
  return (
    <div className="bezel bezel--metric">
      <div className="bezel__core card card--metric">
        <div className="card__top">
          <div className="label">{label}</div>
          {rate != null ? (
            <div
              className="rate"
              title="Instantaneous rate from last poll delta"
            >
              {formatRate(rate)}
            </div>
          ) : (
            <div className="rate rate--pending">—/s</div>
          )}
        </div>
        <div className="value">{value}</div>
        {spark}
      </div>
    </div>
  );
}

export function MetricsGrid({
  totals,
  operational,
  rates = [],
  currentRates = null,
}: {
  totals: TotalsDto;
  operational: OperationalDto;
  rates?: readonly RateSnapshot[];
  currentRates?: Record<TotalsKey, number> | null;
}) {
  return (
    <div className="grid-metrics">
      {COUNTERS.map(([key, label]) => {
        const rate = currentRates?.[key];
        return (
          <MetricBezel
            key={key}
            label={label}
            rate={rate}
            value={formatNumber(totals[key])}
            spark={
              <RateSparkline rates={rates} metric={key} label={label} />
            }
          />
        );
      })}
      <div className="bezel bezel--stat">
        <div className="bezel__core card">
          <div className="label">Queue</div>
          <div className="value">
            {formatNumber(operational.queue_depth)}/
            {formatNumber(operational.queue_capacity)}
          </div>
        </div>
      </div>
      <div className="bezel bezel--stat">
        <div className="bezel__core card">
          <div className="label">App drops</div>
          <div className="value">
            {formatNumber(operational.app_queue_drops_total)}
          </div>
        </div>
      </div>
      <div className="bezel bezel--stat">
        <div className="bezel__core card">
          <div className="label">Kernel drops</div>
          <div className="value">
            {formatNumber(operational.kernel_drops_total)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpsChips({
  journalHealthy,
  notifier,
  sources,
}: {
  journalHealthy: boolean;
  notifier: {
    sent: number;
    failed: number;
    dropped: number;
    suppressed: number;
  };
  sources: OperationalDto["sources"];
}) {
  return (
    <div className="chips">
      <span className="chip">
        Journal <strong>{journalHealthy ? "healthy" : "unhealthy"}</strong>
      </span>
      <span className="chip">
        Webhook sent <strong>{formatNumber(notifier.sent)}</strong>
      </span>
      <span className="chip">
        failed <strong>{formatNumber(notifier.failed)}</strong>
      </span>
      <span className="chip">
        dropped <strong>{formatNumber(notifier.dropped)}</strong>
      </span>
      <span className="chip">
        suppressed <strong>{formatNumber(notifier.suppressed)}</strong>
      </span>
      {sources.map((s) => (
        <span className="chip" key={s.capture_point}>
          {s.capture_point}
          <strong>
            {s.interface} · {s.state}
          </strong>
        </span>
      ))}
    </div>
  );
}
