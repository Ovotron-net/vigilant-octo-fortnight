import type { PolicyRuleDto } from "@/api/types";
import {
  OpsDataTable,
  type OpsColumn,
} from "@/components/common/ops-data-table";
import {
  EnforcementBadge,
  SeverityBadge,
} from "@/components/common/SeverityBadge";
import { portsLabel } from "@/lib/format";

const columns: OpsColumn<PolicyRuleDto>[] = [
  {
    id: "id",
    header: "ID",
    value: (r) => r.id,
    cell: (r) => <code>{r.id}</code>,
  },
  {
    id: "description",
    header: "Description",
    value: (r) => r.description,
  },
  {
    id: "protocol",
    header: "Protocol",
    value: (r) => r.match.protocol,
  },
  {
    id: "ports",
    header: "Ports",
    value: (r) => portsLabel(r.match.destination_ports),
  },
  {
    id: "severity",
    header: "Severity",
    value: (r) => r.severity,
    cell: (r) => <SeverityBadge severity={r.severity} />,
  },
  {
    id: "enforcement",
    header: "Enforcement",
    value: (r) => r.enforcement,
    cell: (r) => (
      <EnforcementBadge enforcement={r.enforcement} enabled={r.enabled} />
    ),
  },
];

export function RulesTable({
  rules,
  compact = false,
}: {
  rules: PolicyRuleDto[];
  compact?: boolean;
}) {
  return (
    <OpsDataTable
      rows={rules}
      columns={columns}
      getRowId={(r) => r.id}
      compact={compact}
      emptyMessage="No rules loaded."
      filterPlaceholder="Filter rules…"
      filterAriaLabel="Filter rules"
      initialSort={{ id: "id", desc: false }}
      preferStatic
    />
  );
}
