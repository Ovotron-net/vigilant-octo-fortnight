import type { OpsState, TotalsDto } from "@/api/types";
import fixture from "./state.fixture.json";

/** Wall-clock origin so successive polls produce growing counters + rates. */
const mockEpochMs = Date.now();

/** Last emitted totals — clamps sine-modulated floors so counters stay monotonic. */
let lastTotals: TotalsDto | null = null;
const lastSourcePackets = new Map<string, number>();

function baseTotals(): TotalsDto {
  return { ...(fixture as OpsState).totals };
}

function clampMonotonic(prev: TotalsDto | null, next: TotalsDto): TotalsDto {
  if (!prev) return next;
  const out = { ...next };
  for (const key of Object.keys(next) as Array<keyof TotalsDto>) {
    out[key] = Math.max(prev[key], next[key]);
  }
  return out;
}

/**
 * Evolve the static fixture so mock mode drives live delta charts.
 * Deterministic rates with a gentle sine modulation (looks alive, not noisy).
 * Counters never decrease between calls so rate charts stay meaningful.
 */
export function evolveMockState(nowMs = Date.now()): OpsState {
  const state = structuredClone(fixture) as OpsState;
  const sec = Math.max(0, (nowMs - mockEpochMs) / 1000);
  // ~0.15 Hz and ~0.09 Hz waves so series are not identical.
  const waveA = 1 + 0.35 * Math.sin(sec * 0.35);
  const waveB = 1 + 0.25 * Math.sin(sec * 0.22 + 1.2);
  const waveC = 1 + 0.4 * Math.sin(sec * 0.5 + 0.4);

  const base = baseTotals();
  // Target average rates (units/sec) for demo traffic.
  const rawTotals: TotalsDto = {
    observations: base.observations + Math.floor(sec * 140 * waveA),
    complete: base.complete + Math.floor(sec * 138 * waveA),
    partial: base.partial + Math.floor(sec * 0.4 * waveB),
    undecodable: base.undecodable + Math.floor(sec * 0.15 * waveC),
    matched_observations: base.matched_observations + Math.floor(sec * 2.2 * waveB),
    rule_matches: base.rule_matches + Math.floor(sec * 2.5 * waveB),
    episodes_started: base.episodes_started + Math.floor(sec * 0.08 * waveC),
    episodes_progressed: base.episodes_progressed + Math.floor(sec * 1.4 * waveA),
    episodes_closed: base.episodes_closed + Math.floor(sec * 0.06 * waveB),
  };
  state.totals = clampMonotonic(lastTotals, rawTotals);
  lastTotals = state.totals;

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

  // Nudge observation counts on sources so chips feel live (monotonic).
  for (const src of state.operational.sources) {
    const factor = src.capture_point === "wan" ? 1.0 : 0.55;
    const raw =
      src.kernel_packets + Math.floor(sec * 90 * factor * waveA);
    const prev = lastSourcePackets.get(src.capture_point) ?? src.kernel_packets;
    src.kernel_packets = Math.max(prev, raw);
    lastSourcePackets.set(src.capture_point, src.kernel_packets);
  }

  return state;
}

/** Reset mock evolution state (tests). */
export function resetMockEvolve(): void {
  lastTotals = null;
  lastSourcePackets.clear();
}
