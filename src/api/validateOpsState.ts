/**
 * Lightweight runtime checks for GET /api/state payloads.
 * Rejects successful HTTP responses whose JSON is not a usable OpsState.
 */

import type {
  EpisodeSummaryDto,
  EvidenceEnvelopeDto,
  EvidenceFlowDto,
  EvidenceRuleDto,
  OpsState,
  OperationalDto,
  PolicyRuleDto,
  SourceStatusDto,
  SystemEventPayload,
  TotalsDto,
  ViolationEpisodePayload,
} from "./types";

export class OpsStateValidationError extends Error {
  constructor(message: string) {
    super(`ops state invalid: ${message}`);
    this.name = "OpsStateValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new OpsStateValidationError(`${path} must be an object`);
  }
  return value;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new OpsStateValidationError(`${path} must be a boolean`);
  }
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new OpsStateValidationError(`${path} must be a finite number`);
  }
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new OpsStateValidationError(`${path} must be a string`);
  }
  return value;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new OpsStateValidationError(`${path} must be an array`);
  }
  return value;
}

function requireStringOrNull(value: unknown, path: string): string | null {
  if (value === null) return null;
  return requireString(value, path);
}

function requireStringOrNumberOrNull(
  value: unknown,
  path: string,
): string | number | null {
  if (value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new OpsStateValidationError(`${path} must be string|number|null`);
}

const TOTALS_KEYS = [
  "observations",
  "complete",
  "partial",
  "undecodable",
  "matched_observations",
  "rule_matches",
  "episodes_started",
  "episodes_progressed",
  "episodes_closed",
] as const;

function parseTotals(value: unknown): TotalsDto {
  const obj = requireRecord(value, "totals");
  const out = {} as TotalsDto;
  for (const key of TOTALS_KEYS) {
    out[key] = requireNumber(obj[key], `totals.${key}`);
  }
  return out;
}

function parseSourceStatus(value: unknown, path: string): SourceStatusDto {
  const src = requireRecord(value, path);
  return {
    capture_point: requireString(src.capture_point, `${path}.capture_point`),
    interface: requireString(src.interface, `${path}.interface`),
    state: requireString(src.state, `${path}.state`),
    source_generation: requireStringOrNumberOrNull(
      src.source_generation,
      `${path}.source_generation`,
    ),
    last_error: requireStringOrNull(src.last_error, `${path}.last_error`),
    kernel_packets: requireNumber(src.kernel_packets, `${path}.kernel_packets`),
    kernel_drops: requireNumber(src.kernel_drops, `${path}.kernel_drops`),
  };
}

function parseOperational(value: unknown): OperationalDto {
  const obj = requireRecord(value, "operational");
  const sources = requireArray(obj.sources, "operational.sources").map(
    (s, i) => parseSourceStatus(s, `operational.sources[${i}]`),
  );

  return {
    state: requireString(obj.state, "operational.state"),
    ready: requireBoolean(obj.ready, "operational.ready"),
    reasons: requireArray(obj.reasons, "operational.reasons").map((r, i) =>
      requireString(r, `operational.reasons[${i}]`),
    ),
    policy_revision:
      obj.policy_revision == null
        ? null
        : requireString(obj.policy_revision, "operational.policy_revision"),
    config_revision:
      obj.config_revision == null
        ? null
        : requireString(obj.config_revision, "operational.config_revision"),
    sensor_id: requireString(obj.sensor_id, "operational.sensor_id"),
    boot_id: requireString(obj.boot_id, "operational.boot_id"),
    queue_depth: requireNumber(obj.queue_depth, "operational.queue_depth"),
    queue_capacity: requireNumber(
      obj.queue_capacity,
      "operational.queue_capacity",
    ),
    app_queue_drops_total: requireNumber(
      obj.app_queue_drops_total,
      "operational.app_queue_drops_total",
    ),
    kernel_drops_total: requireNumber(
      obj.kernel_drops_total,
      "operational.kernel_drops_total",
    ),
    sources,
  };
}

function parseDestinationPorts(
  value: unknown,
  path: string,
): number[] | "any" | null {
  if (value === "any" || value === null) return value;
  return requireArray(value, path).map((p, i) =>
    requireNumber(p, `${path}[${i}]`),
  );
}

function parseRule(value: unknown, path: string): PolicyRuleDto {
  const obj = requireRecord(value, path);
  const match = requireRecord(obj.match, `${path}.match`);
  return {
    id: requireString(obj.id, `${path}.id`),
    description: requireString(obj.description, `${path}.description`),
    enabled: requireBoolean(obj.enabled, `${path}.enabled`),
    match: {
      source_cidrs: requireArray(
        match.source_cidrs,
        `${path}.match.source_cidrs`,
      ).map((c, i) =>
        requireString(c, `${path}.match.source_cidrs[${i}]`),
      ),
      destination_cidrs: requireArray(
        match.destination_cidrs,
        `${path}.match.destination_cidrs`,
      ).map((c, i) =>
        requireString(c, `${path}.match.destination_cidrs[${i}]`),
      ),
      protocol: requireString(match.protocol, `${path}.match.protocol`),
      destination_ports: parseDestinationPorts(
        match.destination_ports,
        `${path}.match.destination_ports`,
      ),
    },
    severity: requireString(obj.severity, `${path}.severity`),
    enforcement: requireString(obj.enforcement, `${path}.enforcement`),
  };
}

function parseEpisode(value: unknown, path: string): EpisodeSummaryDto {
  const obj = requireRecord(value, path);
  return {
    episode_id: requireString(obj.episode_id, `${path}.episode_id`),
    phase: requireString(obj.phase, `${path}.phase`),
    rule_id: requireString(obj.rule_id, `${path}.rule_id`),
    severity: requireString(obj.severity, `${path}.severity`),
    enforcement: requireString(obj.enforcement, `${path}.enforcement`),
    source: requireStringOrNull(obj.source, `${path}.source`),
    destination: requireStringOrNull(obj.destination, `${path}.destination`),
    protocol: requireString(obj.protocol, `${path}.protocol`),
    destination_port:
      obj.destination_port == null
        ? null
        : requireNumber(obj.destination_port, `${path}.destination_port`),
    observation_count: requireNumber(
      obj.observation_count,
      `${path}.observation_count`,
    ),
    observed_bytes: requireNumber(obj.observed_bytes, `${path}.observed_bytes`),
    first_observed_at: requireString(
      obj.first_observed_at,
      `${path}.first_observed_at`,
    ),
    last_observed_at: requireString(
      obj.last_observed_at,
      `${path}.last_observed_at`,
    ),
    close_reason: requireStringOrNull(obj.close_reason, `${path}.close_reason`),
  };
}

function parseEvidenceRule(value: unknown, path: string): EvidenceRuleDto {
  const obj = requireRecord(value, path);
  return {
    id: requireString(obj.id, `${path}.id`),
    description: requireString(obj.description, `${path}.description`),
    severity: requireString(obj.severity, `${path}.severity`),
    enforcement: requireString(obj.enforcement, `${path}.enforcement`),
  };
}

function parseEvidenceFlow(value: unknown, path: string): EvidenceFlowDto {
  const obj = requireRecord(value, path);
  return {
    source: requireStringOrNull(obj.source, `${path}.source`),
    destination: requireStringOrNull(obj.destination, `${path}.destination`),
    protocol: requireString(obj.protocol, `${path}.protocol`),
    destination_port:
      obj.destination_port == null
        ? null
        : requireNumber(obj.destination_port, `${path}.destination_port`),
  };
}

function parseViolationPayload(
  value: Record<string, unknown>,
  path: string,
): ViolationEpisodePayload {
  return {
    episode_id: requireString(value.episode_id, `${path}.episode_id`),
    phase: requireString(value.phase, `${path}.phase`),
    rule: parseEvidenceRule(value.rule, `${path}.rule`),
    flow: parseEvidenceFlow(value.flow, `${path}.flow`),
    first_observed_at: requireString(
      value.first_observed_at,
      `${path}.first_observed_at`,
    ),
    last_observed_at: requireString(
      value.last_observed_at,
      `${path}.last_observed_at`,
    ),
    duration_seconds: requireNumber(
      value.duration_seconds,
      `${path}.duration_seconds`,
    ),
    observation_count: requireNumber(
      value.observation_count,
      `${path}.observation_count`,
    ),
    observed_bytes: requireNumber(value.observed_bytes, `${path}.observed_bytes`),
    close_reason:
      value.close_reason == null
        ? null
        : requireString(value.close_reason, `${path}.close_reason`),
  };
}

function parseSystemEventPayload(
  value: Record<string, unknown>,
  path: string,
): SystemEventPayload {
  return { ...value, name: requireString(value.name, `${path}.name`) };
}

function parseEvent(value: unknown, path: string): EvidenceEnvelopeDto {
  const obj = requireRecord(value, path);
  const payloadObj = requireRecord(obj.payload, `${path}.payload`);
  const isViolation =
    "episode_id" in payloadObj && "phase" in payloadObj && "rule" in payloadObj;
  return {
    schema_version: requireNumber(obj.schema_version, `${path}.schema_version`),
    event_id: requireString(obj.event_id, `${path}.event_id`),
    event_type: requireString(obj.event_type, `${path}.event_type`),
    sensor_id: requireString(obj.sensor_id, `${path}.sensor_id`),
    boot_id: requireString(obj.boot_id, `${path}.boot_id`),
    sequence: requireNumber(obj.sequence, `${path}.sequence`),
    emitted_at: requireString(obj.emitted_at, `${path}.emitted_at`),
    policy_revision:
      obj.policy_revision == null
        ? null
        : requireString(obj.policy_revision, `${path}.policy_revision`),
    payload: isViolation
      ? parseViolationPayload(payloadObj, `${path}.payload`)
      : parseSystemEventPayload(payloadObj, `${path}.payload`),
  };
}

function parseNotifier(value: unknown): OpsState["notifier"] {
  const obj = requireRecord(value, "notifier");
  return {
    sent: requireNumber(obj.sent, "notifier.sent"),
    failed: requireNumber(obj.failed, "notifier.failed"),
    dropped: requireNumber(obj.dropped, "notifier.dropped"),
    suppressed: requireNumber(obj.suppressed, "notifier.suppressed"),
  };
}

/**
 * Assert unknown JSON is a usable OpsState. Throws OpsStateValidationError.
 * Every array element (rules, episodes, events) is parsed and validated so
 * malformed entries fail here instead of throwing during render.
 */
export function parseOpsState(value: unknown): OpsState {
  const root = requireRecord(value, "root");
  const journal = requireRecord(root.journal, "journal");

  return {
    operational: parseOperational(root.operational),
    totals: parseTotals(root.totals),
    rules: requireArray(root.rules, "rules").map((r, i) =>
      parseRule(r, `rules[${i}]`),
    ),
    active_episodes: requireArray(root.active_episodes, "active_episodes").map(
      (e, i) => parseEpisode(e, `active_episodes[${i}]`),
    ),
    active_episodes_truncated: requireBoolean(
      root.active_episodes_truncated,
      "active_episodes_truncated",
    ),
    recent_events: requireArray(root.recent_events, "recent_events").map(
      (e, i) => parseEvent(e, `recent_events[${i}]`),
    ),
    recent_events_truncated: requireBoolean(
      root.recent_events_truncated,
      "recent_events_truncated",
    ),
    journal: {
      healthy: requireBoolean(journal.healthy, "journal.healthy"),
    },
    notifier: parseNotifier(root.notifier),
  };
}
