import type { Severity } from "@/api/types";
import { enforcementLabel } from "@/lib/format";

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
  const label = enforcementLabel(enforcement);
  const drop = enforcement === "nftables_drop_candidate";
  const knownNone = !enforcement || enforcement === "none";
  const kind = drop ? "drop" : knownNone ? "none" : "alert";
  return <span className={`badge badge--${kind}`}>{label}</span>;
}
