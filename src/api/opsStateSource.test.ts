import { describe, expect, it, vi } from "vitest";
import type { OpsState } from "./types";
import { createOpsStateSource } from "./opsStateSource";
import type { OpsConfig } from "./config";

function minimalState(overrides: Partial<OpsState> = {}): OpsState {
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
      sources: [],
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
    ...overrides,
  };
}

const mockConfig: OpsConfig = {
  mode: "mock",
  baseUrl: "",
  pollMs: 2000,
};

const liveConfig: OpsConfig = {
  mode: "live",
  baseUrl: "http://127.0.0.1:9109",
  pollMs: 1500,
};

describe("createOpsStateSource (mock adapter)", () => {
  it("exposes mode, pollMs, and a stable cacheKey", () => {
    const source = createOpsStateSource(mockConfig, { mockDelayMs: 0 });
    expect(source.mode).toBe("mock");
    expect(source.pollMs).toBe(2000);
    expect(source.cacheKey).toBe("mock:/");
  });

  it("load returns evolved fixture state without network", async () => {
    const state = minimalState({ totals: { ...minimalState().totals, observations: 42 } });
    const source = createOpsStateSource(mockConfig, {
      mockDelayMs: 0,
      evolveMockState: () => state,
    });
    await expect(source.load()).resolves.toBe(state);
  });

  it("honors mock delay via injected sleep", async () => {
    const sleep = vi.fn(async () => undefined);
    const source = createOpsStateSource(mockConfig, {
      mockDelayMs: 40,
      sleep,
      evolveMockState: () => minimalState(),
    });
    await source.load();
    expect(sleep).toHaveBeenCalledWith(40);
  });
});

describe("createOpsStateSource (HTTP adapter)", () => {
  it("GETs {baseUrl}/api/state and returns JSON", async () => {
    const body = minimalState();
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const source = createOpsStateSource(liveConfig, { fetch: fetchFn as typeof fetch });
    expect(source.mode).toBe("live");
    expect(source.pollMs).toBe(1500);
    expect(source.cacheKey).toBe("live:http://127.0.0.1:9109");

    const result = await source.load();
    expect(result.totals.observations).toBe(10);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://127.0.0.1:9109/api/state",
      expect.objectContaining({
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    );
  });

  it("throws a clear error on non-OK status", async () => {
    const fetchFn = vi.fn(async () => new Response("nope", { status: 503 }));
    const source = createOpsStateSource(liveConfig, { fetch: fetchFn as typeof fetch });
    await expect(source.load()).rejects.toThrow("ops state HTTP 503");
  });

  it("rejects HTTP 200 with invalid JSON shape", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const source = createOpsStateSource(liveConfig, { fetch: fetchFn as typeof fetch });
    await expect(source.load()).rejects.toThrow(/ops state invalid/);
  });

  it("uses empty base for proxy-relative /api/state", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(minimalState()), { status: 200 }),
    );
    const source = createOpsStateSource(
      { mode: "live", baseUrl: "", pollMs: 2000 },
      { fetch: fetchFn as typeof fetch },
    );
    await source.load();
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/state",
      expect.any(Object),
    );
  });
});
