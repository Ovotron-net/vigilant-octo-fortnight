const numberFmt = new Intl.NumberFormat();

export function formatNumber(value: number | null | undefined): string {
  return numberFmt.format(value ?? 0);
}

/** Format a per-second rate for dense ops UI. */
export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value <= 0) return "0/s";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M/s`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k/s`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k/s`;
  if (value >= 10) return `${value.toFixed(0)}/s`;
  if (value >= 1) return `${value.toFixed(1)}/s`;
  return `${value.toFixed(2)}/s`;
}

export function portsLabel(ports: number[] | "any" | null | undefined): string {
  if (ports === "any" || ports == null) return "any";
  if (Array.isArray(ports)) return ports.length ? ports.join(", ") : "any";
  return String(ports);
}

export function flowLabel(
  source: string | null | undefined,
  destination: string | null | undefined,
  protocol: string | undefined,
  destinationPort: number | null | undefined,
): string {
  const left = source ?? "—";
  const right = destination ?? "—";
  const port = destinationPort == null ? "—" : String(destinationPort);
  return `${left} → ${right} ${protocol ?? "—"}/${port}`;
}

export function enforcementLabel(enforcement: string | undefined): string {
  if (enforcement === "nftables_drop_candidate") return "drop";
  if (!enforcement || enforcement === "none") return "none";
  return enforcement;
}

export function shortId(id: string, keep = 10): string {
  if (id.length <= keep) return id;
  return `${id.slice(0, keep)}…`;
}
