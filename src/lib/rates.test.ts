import { describe, expect, it } from "vitest";
import {
  appendTotalsSample,
  buildRateHistory,
  rateBetween,
  sparklinePath,
  type TotalsSample,
} from "./rates";
import type { TotalsDto } from "@/api/types";

function totals(partial: Partial<TotalsDto>): TotalsDto {
  return {
    observations: 0,
    complete: 0,
    partial: 0,
    undecodable: 0,
    matched_observations: 0,
    rule_matches: 0,
    episodes_started: 0,
    episodes_progressed: 0,
    episodes_closed: 0,
    ...partial,
  };
}

describe("appendTotalsSample", () => {
  it("caps history and skips duplicate timestamps", () => {
    let h: TotalsSample[] = [];
    h = appendTotalsSample(h, { t: 1000, totals: totals({ observations: 1 }) }, 3);
    h = appendTotalsSample(h, { t: 1000, totals: totals({ observations: 2 }) }, 3);
    expect(h).toHaveLength(1);
    h = appendTotalsSample(h, { t: 2000, totals: totals({ observations: 3 }) }, 3);
    h = appendTotalsSample(h, { t: 3000, totals: totals({ observations: 4 }) }, 3);
    h = appendTotalsSample(h, { t: 4000, totals: totals({ observations: 5 }) }, 3);
    expect(h).toHaveLength(3);
    expect(h[0]!.t).toBe(2000);
    expect(h[2]!.totals.observations).toBe(5);
  });
});

describe("rateBetween", () => {
  it("computes per-second rates", () => {
    const prev: TotalsSample = { t: 1000, totals: totals({ observations: 100 }) };
    const curr: TotalsSample = { t: 3000, totals: totals({ observations: 300 }) };
    const snap = rateBetween(prev, curr);
    expect(snap).not.toBeNull();
    expect(snap!.dtSec).toBe(2);
    expect(snap!.rates.observations).toBe(100); // +200 over 2s
  });

  it("zeros negative deltas (counter reset)", () => {
    const prev: TotalsSample = { t: 1000, totals: totals({ observations: 500 }) };
    const curr: TotalsSample = { t: 2000, totals: totals({ observations: 10 }) };
    const snap = rateBetween(prev, curr);
    expect(snap!.rates.observations).toBe(0);
  });
});

describe("buildRateHistory", () => {
  it("needs at least two samples", () => {
    expect(buildRateHistory([{ t: 1, totals: totals({}) }])).toEqual([]);
    const rates = buildRateHistory([
      { t: 0, totals: totals({ matched_observations: 0 }) },
      { t: 1000, totals: totals({ matched_observations: 5 }) },
      { t: 2000, totals: totals({ matched_observations: 15 }) },
    ]);
    expect(rates).toHaveLength(2);
    expect(rates[0]!.rates.matched_observations).toBe(5);
    expect(rates[1]!.rates.matched_observations).toBe(10);
  });
});

describe("sparklinePath", () => {
  it("returns a path for multiple values", () => {
    const path = sparklinePath([0, 1, 0.5], 100, 20);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.includes(" L ")).toBe(true);
  });
});
