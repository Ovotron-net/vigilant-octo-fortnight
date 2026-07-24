import type { EvidenceEnvelopeDto } from "@/api/types";
import { isViolationPayload } from "@/api/types";
import {
  OpsDataTable,
  type OpsColumn,
} from "@/components/common/ops-data-table";
import { PhaseBadge, SeverityBadge } from "@/components/common/SeverityBadge";
import { flowLabel } from "@/lib/format";
import { formatTimestamp } from "@/lib/time";

function detailFor(event: EvidenceEnvelopeDto): string {
  const p = event.payload;
  if (isViolationPayload(p)) {
    return `${p.rule.id} ${flowLabel(
      p.flow.source,
      p.flow.destination,
      p.flow.protocol,
      p.flow.destination_port ?? null,
    )}`;
  }
  return String(p.name ?? "—");
}

const columns: OpsColumn<EvidenceEnvelopeDto>[] = [
  {
    id: "emitted_at",
    header: "Emitted",
    value: (e) => e.emitted_at,
    cell: (e) => formatTimestamp(e.emitted_at),
    width: "10rem",
  },
  {
    id: "type",
    header: "Type",
    value: (e) =>
      isViolationPayload(e.payload) ? e.payload.phase : e.event_type,
    cell: (e) =>
      isViolationPayload(e.payload) ? (
        <PhaseBadge phase={e.payload.phase} />
      ) : (
        <span className="badge badge--alert">{e.event_type}</span>
      ),
    width: "6rem",
  },
  {
    id: "detail",
    header: "Detail",
    value: (e) => detailFor(e),
    cell: (e) => <code>{detailFor(e)}</code>,
    width: "1.8fr",
  },
  {
    id: "severity",
    header: "Severity",
    value: (e) =>
      isViolationPayload(e.payload) ? e.payload.rule.severity : "",
    cell: (e) =>
      isViolationPayload(e.payload) ? (
        <SeverityBadge severity={e.payload.rule.severity} />
      ) : (
        "—"
      ),
    width: "5.5rem",
  },
  {
    id: "sequence",
    header: "Seq",
    value: (e) => e.sequence,
    cell: (e) => String(e.sequence),
    hideWhenCompact: true,
    hideWhenVirtual: true,
  },
];

export function EvidenceTable({
  events,
  truncated,
  compact = false,
}: {
  events: EvidenceEnvelopeDto[];
  truncated: boolean;
  compact?: boolean;
}) {
  return (
    <OpsDataTable
      rows={events}
      columns={columns}
      getRowId={(e) => String(e.sequence)}
      compact={compact}
      emptyMessage="No evidence yet."
      truncated={truncated}
      truncationLabel="recent evidence"
      filterPlaceholder="Filter evidence…"
      filterAriaLabel="Filter evidence"
      initialSort={{ id: "sequence", desc: true }}
      facet={{
        ariaLabel: "Filter by event type",
        allLabel: "All types",
        options: [
          { value: "violation", label: "Violations" },
          { value: "system", label: "System" },
        ],
        match: (e, v) =>
          v === "violation"
            ? e.event_type === "violation_episode"
            : e.event_type !== "violation_episode",
      }}
    />
  );
}
