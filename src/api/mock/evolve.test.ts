import { describe, expect, it, beforeEach } from "vitest";
import { evolveMockState, resetMockEvolve } from "./evolve";

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
});
