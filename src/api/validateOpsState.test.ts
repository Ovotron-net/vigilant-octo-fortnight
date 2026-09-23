import { describe, expect, it } from "vitest";
import { parseOpsState, OpsStateValidationError } from "./validateOpsState";
import type { OpsState } from "./types";
import { isViolationPayload } from "./types";

function validState(): OpsState {
  return {
    operational: {
      ready: true,
      state: "running",
      reasons: [],
      sensor_id: "s1",
      boot_id: "b1",
      policy_revision: "1",
      config_revision: null,
      queue_depth: 0,
      queue_capacity: 100,
      app_queue_drops_total: 0,
      kernel_drops_total: 0,
      sources: [
        {
          capture_point: "wan",
          interface: "eth0",
          state: "up",
          source_generation: 1,
          last_error: null,
          kernel_packets: 0,
          kernel_drops: 0,
        },
      ],
    },
    totals: {
      observations: 10,
      complete: 9,
      partial: 1,
      undecodable: 0,
      matched_observations: 0,
      rule_matches: 0,
      episodes_started: 0,
      episodes_progressed: 0,
      episodes_closed: 0,
    },
    rules: [],
    active_episodes: [],
    active_episodes_truncated: false,
    recent_events: [],
    recent_events_truncated: false,
    journal: { healthy: true },
    notifier: { sent: 0, failed: 0, dropped: 0, suppressed: 0 },
  };
}

describe("parseOpsState", () => {
  it("accepts a well-formed snapshot", () => {
    const parsed = parseOpsState(validState());
    expect(parsed.totals.observations).toBe(10);
    expect(parsed.operational.sensor_id).toBe("s1");
  });

  it("rejects missing totals keys", () => {
    const bad = validState() as unknown as Record<string, unknown>;
    const totals = { ...(bad.totals as object) } as Record<string, unknown>;
    delete totals.observations;
    bad.totals = totals;
    expect(() => parseOpsState(bad)).toThrow(OpsStateValidationError);
    expect(() => parseOpsState(bad)).toThrow(/totals\.observations/);
  });

  it("rejects non-object root", () => {
    expect(() => parseOpsState(null)).toThrow(/root must be an object/);
  });

  it("rejects non-boolean ready", () => {
    const bad = validState();
    (bad.operational as { ready: unknown }).ready = "yes";
    expect(() => parseOpsState(bad)).toThrow(/operational\.ready/);
  });

  it("rejects a source with an object-valued interface field", () => {
    const bad = validState();
    (bad.operational.sources[0] as unknown as Record<string, unknown>).interface =
      { nested: true };
    expect(() => parseOpsState(bad)).toThrow(/sources\[0\]\.interface/);
  });

  it("rejects a rule element missing match", () => {
    const bad = validState() as unknown as Record<string, unknown>;
    bad.rules = [{}];
    expect(() => parseOpsState(bad)).toThrow(/rules\[0\]\.match/);
  });

  it("accepts a well-formed rule element", () => {
    const good = validState();
    good.rules = [
      {
        id: "r1",
        description: "test rule",
        enabled: true,
        match: {
          source_cidrs: ["10.0.0.0/8"],
          destination_cidrs: ["0.0.0.0/0"],
          protocol: "tcp",
          destination_ports: [443],
        },
        severity: "high",
        enforcement: "none",
      },
    ];
    const parsed = parseOpsState(good);
    expect(parsed.rules[0]!.match.protocol).toBe("tcp");
  });

  it("rejects an episode element missing required fields", () => {
    const bad = validState() as unknown as Record<string, unknown>;
    bad.active_episodes = [{ episode_id: "e1" }];
    expect(() => parseOpsState(bad)).toThrow(/active_episodes\[0\]\.phase/);
  });

  it("rejects an evidence event whose violation payload is malformed", () => {
    const bad = validState() as unknown as Record<string, unknown>;
    bad.recent_events = [
      {
        schema_version: 1,
        event_id: "ev1",
        event_type: "violation_episode",
        sensor_id: "s1",
        boot_id: "b1",
        sequence: 1,
        emitted_at: "2024-01-01T00:00:00Z",
        policy_revision: null,
        payload: { episode_id: "e1", phase: "open", rule: {} },
      },
    ];
    expect(() => parseOpsState(bad)).toThrow(/recent_events\[0\]\.payload\.rule\.id/);
  });
});

describe("isViolationPayload", () => {
  it("requires rule.id", () => {
    expect(
      isViolationPayload({
        episode_id: "e1",
        phase: "open",
        rule: { id: "r1" } as never,
      } as never),
    ).toBe(true);
    expect(
      isViolationPayload({
        episode_id: "e1",
        phase: "open",
        rule: "not-an-object",
      } as never),
    ).toBe(false);
    expect(
      isViolationPayload({
        episode_id: "e1",
        phase: "open",
        rule: { description: "missing id" },
      } as never),
    ).toBe(false);
  });
});
