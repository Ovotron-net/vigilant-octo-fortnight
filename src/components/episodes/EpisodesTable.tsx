import type { EpisodeSummaryDto } from "@/api/types";
import {
  OpsDataTable,
  type OpsColumn,
} from "@/components/common/ops-data-table";
import { PhaseBadge, SeverityBadge } from "@/components/common/SeverityBadge";
import { flowLabel, formatNumber } from "@/lib/format";
import { formatTimestamp } from "@/lib/time";

const columns: OpsColumn<EpisodeSummaryDto>[] = [
  {
    id: "episode_id",
    header: "Episode",
    value: (e) => e.episode_id,
    cell: (e) => <code>{e.episode_id}</code>,
    width: "9rem",
  },
  {
    id: "rule_id",
    header: "Rule",
    value: (e) => e.rule_id,
    cell: (e) => <code>{e.rule_id}</code>,
    width: "8rem",
  },
  {
    id: "flow",
    header: "Flow",
    value: (e) =>
      flowLabel(e.source, e.destination, e.protocol, e.destination_port),
    cell: (e) => (
      <code>
        {flowLabel(e.source, e.destination, e.protocol, e.destination_port)}
      </code>
    ),
    width: "1.6fr",
  },
  {
    id: "observation_count",
    header: "Count",
    value: (e) => e.observation_count,
    cell: (e) => formatNumber(e.observation_count),
    width: "4.5rem",
  },
  {
    id: "severity",
    header: "Severity",
    value: (e) => e.severity,
    cell: (e) => (
      <>
        <SeverityBadge severity={e.severity} />{" "}
        <PhaseBadge phase={e.phase} />
      </>
    ),
    width: "5.5rem",
  },
  {
    id: "last_observed_at",
    header: "Last seen",
    value: (e) => e.last_observed_at,
    cell: (e) => formatTimestamp(e.last_observed_at),
    width: "9rem",
  },
];

export function EpisodesTable({
  episodes,
  truncated,
  compact = false,
}: {
  episodes: EpisodeSummaryDto[];
  truncated: boolean;
  compact?: boolean;
}) {
  return (
    <OpsDataTable
      rows={episodes}
      columns={columns}
      getRowId={(e) => e.episode_id}
      compact={compact}
      emptyMessage="No active episodes."
      truncated={truncated}
      truncationLabel="active episodes"
      filterPlaceholder="Filter episodes…"
      filterAriaLabel="Filter episodes"
      initialSort={{ id: "last_observed_at", desc: true }}
      facet={{
        ariaLabel: "Filter by severity",
        allLabel: "All severities",
        options: [
          { value: "critical", label: "critical" },
          { value: "high", label: "high" },
          { value: "medium", label: "medium" },
          { value: "low", label: "low" },
        ],
        match: (e, v) => e.severity === v,
      }}
      summary={({ visibleCount, facetValue }) =>
        `${visibleCount} episode${visibleCount === 1 ? "" : "s"}${
          facetValue ? ` · severity ${facetValue}` : ""
        }`
      }
    />
  );
}
