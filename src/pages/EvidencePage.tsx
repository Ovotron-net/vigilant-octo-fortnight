import { useOpsState } from "@/hooks/useOpsState";
import { EvidenceTable } from "@/components/evidence/EvidenceTable";

export function EvidencePage() {
  const { data, isLoading } = useOpsState();
  if (isLoading && !data) {
    return <p className="empty empty--loading">Loading…</p>;
  }
  if (!data) return null;
  return (
    <section className="section">
      <p className="page-eyebrow">Audit trail</p>
      <h2 className="page-title">Recent evidence</h2>
      <p className="page-lead">
        Newest-first envelopes from the sensor ring — violations and system
        events.
      </p>
      <div className="table-bezel">
        <EvidenceTable
          events={data.recent_events}
          truncated={data.recent_events_truncated}
        />
      </div>
    </section>
  );
}
