import { Link } from "@tanstack/react-router";
import { useOpsState } from "@/hooks/useOpsState";
import { useTotalsHistory } from "@/hooks/useTotalsHistory";
import { MetricsGrid, OpsChips } from "@/components/metrics/MetricsGrid";
import { RateCharts } from "@/components/metrics/RateCharts";
import { RulesTable } from "@/components/rules/RulesTable";
import { EpisodesTable } from "@/components/episodes/EpisodesTable";
import { EvidenceTable } from "@/components/evidence/EvidenceTable";

function ViewAllLink({ to }: { to: "/episodes" | "/evidence" | "/rules" }) {
  return (
    <Link to={to} className="compact-link">
      View all
      <span className="compact-link__icon" aria-hidden>
        ↗
      </span>
    </Link>
  );
}

export function OverviewPage() {
  const { data, isLoading, dataUpdatedAt } = useOpsState();
  const history = useTotalsHistory(data?.totals, dataUpdatedAt);

  if (isLoading && !data) {
    return <p className="empty empty--loading">Loading ops state…</p>;
  }
  if (!data) return null;

  return (
    <>
      <p className="page-eyebrow">Live sensor</p>
      <h2 className="page-title">Overview</h2>
      <p className="page-lead">
        Read-only snapshot of totals, rates, active episodes, evidence, and
        policy — polled from the ops listener.
      </p>

      <section className="section" aria-label="Health chips">
        <OpsChips
          journalHealthy={data.journal.healthy}
          notifier={data.notifier}
          sources={data.operational.sources}
        />
      </section>

      <section className="section" aria-labelledby="metrics-heading">
        <div className="section-head">
          <h2 id="metrics-heading">Metrics</h2>
          <span className="section-meta">
            {history.ready
              ? `${history.rates.length} rate samples`
              : "rates after 2nd poll"}
          </span>
        </div>
        <MetricsGrid
          totals={data.totals}
          operational={data.operational}
          rates={history.rates}
          currentRates={history.currentRates}
        />
      </section>

      <section className="section" aria-labelledby="rates-heading">
        <div className="section-head">
          <h2 id="rates-heading">Live rates</h2>
          <span className="section-meta">Δ totals / elapsed · per second</span>
        </div>
        <RateCharts rates={history.rates} />
      </section>

      <section className="section" aria-labelledby="episodes-heading">
        <div className="section-head">
          <h2 id="episodes-heading">Active episodes</h2>
          <ViewAllLink to="/episodes" />
        </div>
        <div className="table-bezel">
          <EpisodesTable
            episodes={data.active_episodes}
            truncated={data.active_episodes_truncated}
            compact
          />
        </div>
      </section>

      <section className="section" aria-labelledby="evidence-heading">
        <div className="section-head">
          <h2 id="evidence-heading">Recent evidence</h2>
          <ViewAllLink to="/evidence" />
        </div>
        <div className="table-bezel">
          <EvidenceTable
            events={data.recent_events}
            truncated={data.recent_events_truncated}
            compact
          />
        </div>
      </section>

      <section className="section" aria-labelledby="rules-heading">
        <div className="section-head">
          <h2 id="rules-heading">Policy rules</h2>
          <ViewAllLink to="/rules" />
        </div>
        <div className="table-bezel">
          <RulesTable rules={data.rules} compact />
        </div>
      </section>
    </>
  );
}
