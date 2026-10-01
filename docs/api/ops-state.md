# `GET /api/state` contract

The live console polls `GET /api/state` with `Accept: application/json` and
browser caching disabled. A non-2xx response, invalid JSON, or a payload that
fails runtime validation is treated as a polling error.

The authoritative consumer-side validator is
[`src/api/validateOpsState.ts`](../../src/api/validateOpsState.ts). A complete
accepted example is
[`src/api/mock/state.fixture.json`](../../src/api/mock/state.fixture.json).

## Top-level object

Every field below is required.

| Field | Type | Purpose |
|---|---|---|
| `operational` | object | Sensor identity, readiness, queues, and capture sources |
| `totals` | object | Monotonic counters used for cards and rates |
| `rules` | array | Current policy rules |
| `active_episodes` | array | Active violation summaries |
| `active_episodes_truncated` | boolean | Sensor omitted older active episodes |
| `recent_events` | array | Recent evidence envelopes |
| `recent_events_truncated` | boolean | Sensor omitted older evidence |
| `journal` | object | Contains required boolean `healthy` |
| `notifier` | object | Required numeric `sent`, `failed`, `dropped`, and `suppressed` counters |

All numeric fields must be finite numbers. Timestamps are validated as strings;
the sensor should emit ISO 8601 values so the UI can format them correctly.

## Operational state

`operational` requires:

- `state: string`, `ready: boolean`, and `reasons: string[]`
- `policy_revision: string | null` and `config_revision: string | null`
- `sensor_id: string` and `boot_id: string`
- numeric `queue_depth`, `queue_capacity`, `app_queue_drops_total`, and
  `kernel_drops_total`
- `sources: SourceStatus[]`

Each source requires `capture_point`, `interface`, and `state` strings;
`source_generation` as a string, number, or null; `last_error` as a string or
null; and numeric `kernel_packets` and `kernel_drops`.

## Totals

All counters are required numbers:

```text
observations
complete
partial
undecodable
matched_observations
rule_matches
episodes_started
episodes_progressed
episodes_closed
```

The console derives per-second rates from deltas between snapshots. Counters
should therefore be monotonic during a sensor boot. A decrease is interpreted
as a restart and produces a zero rate for that interval.

## Rules

Each rule requires:

- `id: string`, `description: string`, and `enabled: boolean`
- `severity: string` and `enforcement: string`
- `match.source_cidrs: string[]`
- `match.destination_cidrs: string[]`
- `match.protocol: string`
- `match.destination_ports: number[] | "any" | null`

The console accepts new severity and enforcement strings for forward
compatibility; known values receive the intended presentation.

## Active episodes

Each active episode requires:

- string `episode_id`, `phase`, `rule_id`, `severity`, `enforcement`, and
  `protocol`
- `source`, `destination`, and `close_reason` as strings or null
- `destination_port` as a number or null
- numeric `observation_count` and `observed_bytes`
- string `first_observed_at` and `last_observed_at`

`active_episodes_truncated: true` means this is a sensor-capped window, not the
complete active set.

## Recent evidence

Every envelope requires numeric `schema_version` and `sequence`; string
`event_id`, `event_type`, `sensor_id`, `boot_id`, `emitted_at`; nullable string
`policy_revision`; and an object `payload`.

The runtime validator classifies a payload as a violation when it contains
`episode_id`, `phase`, and `rule`. Such a payload requires:

- string `episode_id` and `phase`
- `rule` with string `id`, `description`, `severity`, and `enforcement`
- `flow` with nullable-string `source` and `destination`, string `protocol`,
  and numeric-or-null `destination_port`
- string `first_observed_at` and `last_observed_at`
- numeric `duration_seconds`, `observation_count`, and `observed_bytes`
- string-or-null `close_reason`

Only those violation fields are retained by the parser. Optional wire fields
declared in `src/api/types.ts`, such as ICMP details or per-capture-point
counts, are not currently preserved for rendering.

Any other payload is treated as a system event. It must contain `name: string`;
its additional payload keys are preserved.

`recent_events_truncated: true` means the sensor returned only its retained
recent-event window.

## Compatibility failures

Validation throws `OpsStateValidationError` with a field path, for example:

```text
ops state invalid: totals.observations must be a finite number
```

If no prior snapshot exists, the UI shows an invalid-data error. If a valid
snapshot is already displayed, it remains visible and the header reports a
poll error. Treat validation errors after a sensor or console upgrade as
contract-version skew.
