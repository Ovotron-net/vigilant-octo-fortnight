import { describe, expect, it, beforeEach } from "vitest";
import { evolveMockState, resetMockEvolve } from "./evolve";
import { parseOpsState } from "@/api/validateOpsState";

describe("evolveMockState", () => {
  beforeEach(() => {
    resetMockEvolve();
  });

  it("keeps totals monotonic across successive calls", () => {
    const t0 = Date.now();
    const samples = [
      evolveMockState(t0),
      evolveMockState(t0 + 500),
      evolveMockState(t0 + 1500),
      evolveMockState(t0 + 3000),
      evolveMockState(t0 + 5000),
      evolveMockState(t0 + 8000),
      evolveMockState(t0 + 12000),
    ];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]!.totals;
      const curr = samples[i]!.totals;
      for (const key of Object.keys(curr) as Array<keyof typeof curr>) {
        expect(curr[key]).toBeGreaterThanOrEqual(prev[key]);
      }
    }
    // High-rate series should actually move over multi-second windows.
    expect(samples.at(-1)!.totals.observations).toBeGreaterThan(
      samples[0]!.totals.observations,
    );
  });

  it("advances low-rate counters via carried fractional remainders", () => {
    const t0 = Date.now();
    // episodes_started ~0.08/s: each 2s poll adds ~0.16, below 0.5 and thus
    // always rounded to 0 without a carried remainder.
    let last = evolveMockState(t0).totals.episodes_started;
    let advanced = false;
    for (let i = 1; i <= 20; i++) {
      const next = evolveMockState(t0 + i * 2000).totals.episodes_started;
      expect(next).toBeGreaterThanOrEqual(last);
      if (next > last) advanced = true;
      last = next;
    }
    expect(advanced).toBe(true);
  });

  it("produces a snapshot that passes parseOpsState", () => {
    expect(() => parseOpsState(evolveMockState())).not.toThrow();
  });
});
