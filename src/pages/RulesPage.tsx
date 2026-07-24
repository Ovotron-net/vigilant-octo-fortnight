import { useOpsState } from "@/hooks/useOpsState";
import { RulesTable } from "@/components/rules/RulesTable";

export function RulesPage() {
  const { data, isLoading } = useOpsState();
  if (isLoading && !data) {
    return <p className="empty empty--loading">Loading…</p>;
  }
  if (!data) return null;
  return (
    <section className="section">
      <p className="page-eyebrow">Policy</p>
      <h2 className="page-title">Policy rules</h2>
      <p className="page-lead">
        Loaded rules with match criteria, severity, and enforcement stance.
      </p>
      <div className="table-bezel">
        <RulesTable rules={data.rules} />
      </div>
    </section>
  );
}
