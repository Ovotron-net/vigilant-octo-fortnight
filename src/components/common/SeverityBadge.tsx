import type { Severity } from "@/api/types";

const KNOWN = new Set(["low", "medium", "high", "critical"]);

export function SeverityBadge({ severity }: { severity: Severity }) {
  const kind = KNOWN.has(severity) ? severity : "low";
  return <span className={`badge badge--${kind}`}>{severity || "—"}</span>;
}

export function PhaseBadge({ phase }: { phase: string }) {
  return <span className="badge badge--alert">{phase || "—"}</span>;
}

export function EnforcementBadge({
  enforcement,
  enabled = true,
}: {
  enforcement: string;
  enabled?: boolean;
}) {
  if (!enabled) {
    return <span className="badge badge--disabled">disabled</span>;
  }
  const drop = enforcement === "nftables_drop_candidate";
  return (
    <span className={`badge badge--${drop ? "drop" : "none"}`}>
      {drop ? "drop" : "none"}
    </span>
  );
}
