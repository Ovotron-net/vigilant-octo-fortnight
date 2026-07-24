import { useOpsState } from "@/hooks/useOpsState";
import { EpisodesTable } from "@/components/episodes/EpisodesTable";

export function EpisodesPage() {
  const { data, isLoading } = useOpsState();
  if (isLoading && !data) {
    return <p className="empty empty--loading">Loading…</p>;
  }
  if (!data) return null;
  return (
    <section className="section">
      <p className="page-eyebrow">Enforcement</p>
      <h2 className="page-title">Active episodes</h2>
      <p className="page-lead">
        Open and progressing policy violations with flow and severity context.
      </p>
      <div className="table-bezel">
        <EpisodesTable
          episodes={data.active_episodes}
          truncated={data.active_episodes_truncated}
        />
      </div>
    </section>
  );
}
