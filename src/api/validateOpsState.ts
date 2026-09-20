/**
 * Lightweight runtime checks for GET /api/state payloads.
 * Rejects successful HTTP responses whose JSON is not a usable OpsState.
 */

import type { OpsState, OperationalDto, TotalsDto } from "./types";

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

function parseOperational(value: unknown): OperationalDto {
  const obj = requireRecord(value, "operational");
  const sources = requireArray(obj.sources, "operational.sources");
  for (let i = 0; i < sources.length; i++) {
    const src = requireRecord(sources[i], `operational.sources[${i}]`);
    requireString(src.capture_point, `operational.sources[${i}].capture_point`);
    requireString(src.state, `operational.sources[${i}].state`);
    if (src.last_error != null && typeof src.last_error !== "string") {
      throw new OpsStateValidationError(
        `operational.sources[${i}].last_error must be string|null`,
      );
    }
  }

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
    sources: sources as OperationalDto["sources"],
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
 * Arrays of rules/episodes/events are shape-checked only at the container level
 * (element-level UI guards remain in place for evidence payloads).
 */
export function parseOpsState(value: unknown): OpsState {
  const root = requireRecord(value, "root");
  const journal = requireRecord(root.journal, "journal");

  return {
    operational: parseOperational(root.operational),
    totals: parseTotals(root.totals),
    rules: requireArray(root.rules, "rules") as OpsState["rules"],
    active_episodes: requireArray(
      root.active_episodes,
      "active_episodes",
    ) as OpsState["active_episodes"],
    active_episodes_truncated: requireBoolean(
      root.active_episodes_truncated,
      "active_episodes_truncated",
    ),
    recent_events: requireArray(
      root.recent_events,
      "recent_events",
    ) as OpsState["recent_events"],
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
