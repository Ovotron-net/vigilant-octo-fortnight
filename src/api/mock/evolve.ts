import type { OpsState, TotalsDto } from "@/api/types";
import fixture from "./state.fixture.json";

/** Wall-clock origin so successive polls produce growing counters + rates. */
const mockEpochMs = Date.now();

/** Last emit time + totals — integrate positive instantaneous rates over Δt. */
let lastNowMs = mockEpochMs;
let lastTotals: TotalsDto | null = null;
const lastSourcePackets = new Map<string, number>();

function baseTotals(): TotalsDto {
  return { ...(fixture as OpsState).totals };
}

/**
 * Evolve the static fixture so mock mode drives live delta charts.
 * Instantaneous sine-modulated rates are integrated over elapsed time so
 * counters stay strictly monotonic and sparklines keep moving.
 */
export function evolveMockState(nowMs = Date.now()): OpsState {
  const state = structuredClone(fixture) as OpsState;
  const sec = Math.max(0, (nowMs - mockEpochMs) / 1000);
  const dtSec = Math.max(0, (nowMs - lastNowMs) / 1000);
  // ~0.15 Hz and ~0.09 Hz waves so series are not identical.
  const waveA = 1 + 0.35 * Math.sin(sec * 0.35);
  const waveB = 1 + 0.25 * Math.sin(sec * 0.22 + 1.2);
  const waveC = 1 + 0.4 * Math.sin(sec * 0.5 + 0.4);

  const prev = lastTotals ?? baseTotals();
  // Target average rates (units/sec); integrate over dt so totals never drop.
  const add = (rate: number) => Math.max(0, Math.round(rate * dtSec));
  state.totals = {
    observations: prev.observations + add(140 * waveA),
    complete: prev.complete + add(138 * waveA),
    partial: prev.partial + add(0.4 * waveB),
    undecodable: prev.undecodable + add(0.15 * waveC),
    matched_observations: prev.matched_observations + add(2.2 * waveB),
    rule_matches: prev.rule_matches + add(2.5 * waveB),
    episodes_started: prev.episodes_started + add(0.08 * waveC),
    episodes_progressed: prev.episodes_progressed + add(1.4 * waveA),
    episodes_closed: prev.episodes_closed + add(0.06 * waveB),
  };
  lastTotals = state.totals;
  lastNowMs = nowMs;

  const qCap = state.operational.queue_capacity;
  state.operational.queue_depth = Math.min(
    qCap,
    Math.max(0, Math.round(30 + 80 * (0.5 + 0.5 * Math.sin(sec * 0.4)))),
  );
  state.operational.app_queue_drops_total =
    (fixture as OpsState).operational.app_queue_drops_total +
    Math.floor(sec * 0.02 * Math.max(0, waveC - 1));
  state.operational.kernel_drops_total =
    (fixture as OpsState).operational.kernel_drops_total +
    Math.floor(sec * 0.05 * waveB);

  for (const src of state.operational.sources) {
    const factor = src.capture_point === "wan" ? 1.0 : 0.55;
    const prevPkts =
      lastSourcePackets.get(src.capture_point) ?? src.kernel_packets;
    const next = prevPkts + add(90 * factor * waveA);
    src.kernel_packets = next;
    lastSourcePackets.set(src.capture_point, next);
  }

  return state;
}

/** Reset mock evolution state (tests). */
export function resetMockEvolve(): void {
  lastTotals = null;
  lastNowMs = mockEpochMs;
  lastSourcePackets.clear();
}
