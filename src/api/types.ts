/** Wire types for ibn-monitor GET /api/state (ReadModel.view). */

export type Severity = "low" | "medium" | "high" | "critical" | string;
export type Enforcement = "none" | "nftables_drop_candidate" | string;

export type SourceStatusDto = {
  capture_point: string;
  interface: string;
  state: string;
  source_generation: string | number | null;
  last_error: string | null;
  kernel_packets: number;
  kernel_drops: number;
};

export type OperationalDto = {
  state: string;
  ready: boolean;
  reasons: string[];
  policy_revision: string | null;
  config_revision: string | null;
  sensor_id: string;
  boot_id: string;
  queue_depth: number;
  queue_capacity: number;
  app_queue_drops_total: number;
  kernel_drops_total: number;
  sources: SourceStatusDto[];
};

export type TotalsDto = {
  observations: number;
  complete: number;
  partial: number;
  undecodable: number;
  matched_observations: number;
  rule_matches: number;
  episodes_started: number;
  episodes_progressed: number;
  episodes_closed: number;
};

export type PolicyRuleDto = {
  id: string;
  description: string;
  enabled: boolean;
  match: {
    source_cidrs: string[];
    destination_cidrs: string[];
    protocol: string;
    destination_ports: number[] | "any" | null;
  };
  severity: Severity;
  enforcement: Enforcement;
};

export type EpisodeSummaryDto = {
  episode_id: string;
  phase: string;
  rule_id: string;
  severity: Severity;
  enforcement: Enforcement;
  source: string | null;
  destination: string | null;
  protocol: string;
  destination_port: number | null;
  observation_count: number;
  observed_bytes: number;
  first_observed_at: string;
  last_observed_at: string;
  close_reason: string | null;
};

export type EvidenceRuleDto = {
  id: string;
  description: string;
  severity: Severity;
  enforcement: Enforcement;
};

export type EvidenceFlowDto = {
  ip_version?: number;
  source: string | null;
  destination: string | null;
  protocol: string;
  source_port?: number | null;
  destination_port?: number | null;
  icmp_type?: number | null;
  icmp_code?: number | null;
  fields?: string;
  decode_reason?: string | null;
};

export type ViolationEpisodePayload = {
  episode_id: string;
  phase: string;
  rule: EvidenceRuleDto;
  flow: EvidenceFlowDto;
  first_observed_at: string;
  last_observed_at: string;
  duration_seconds: number;
  observation_count: number;
  observed_bytes: number;
  late_observation_count?: number;
  per_capture_point?: Record<string, { observations: number; observed_bytes: number }>;
  truncated?: boolean;
  close_reason?: string | null;
  name?: never;
};

export type SystemEventPayload = {
  name: string;
  [key: string]: unknown;
};

export type EvidenceEnvelopeDto = {
  schema_version: number;
  event_id: string;
  event_type: string;
  sensor_id: string;
  boot_id: string;
  sequence: number;
  emitted_at: string;
  policy_revision: string | null;
  payload: ViolationEpisodePayload | SystemEventPayload;
};

export type OpsState = {
  operational: OperationalDto;
  totals: TotalsDto;
  rules: PolicyRuleDto[];
  active_episodes: EpisodeSummaryDto[];
  active_episodes_truncated: boolean;
  recent_events: EvidenceEnvelopeDto[];
  recent_events_truncated: boolean;
  journal: { healthy: boolean };
  notifier: {
    sent: number;
    failed: number;
    dropped: number;
    suppressed: number;
  };
};

export function isViolationPayload(
  payload: EvidenceEnvelopeDto["payload"],
): payload is ViolationEpisodePayload {
  if (typeof payload !== "object" || payload === null) return false;
  if (
    !("episode_id" in payload) ||
    !("phase" in payload) ||
    !("rule" in payload)
  ) {
    return false;
  }
  const rule = (payload as { rule: unknown }).rule;
  return (
    typeof rule === "object" &&
    rule !== null &&
    typeof (rule as { id?: unknown }).id === "string"
  );
}
