/**
 * Deep module: obtain ops state snapshots for the console.
 *
 * External interface: OpsStateSource { mode, pollMs, cacheKey, load() }.
 * Adapters: mock (evolve fixture) and live (HTTP GET /api/state).
 * Two adapters ⇒ real seam. Config is loaded once via loadOpsConfig.
 */

import type { OpsState } from "./types";
import type { OpsConfig, OpsMode } from "./config";
import { loadOpsConfig } from "./config";
import { evolveMockState } from "./mock/evolve";

export type OpsStateSource = {
  readonly mode: OpsMode;
  readonly pollMs: number;
  /** Stable React Query key fragment (mode + baseUrl). */
  readonly cacheKey: string;
  load(): Promise<OpsState>;
};

/** Injectable deps for adapters (tests substitute fetch / evolve / delay). */
export type OpsStateSourceDeps = {
  fetch?: typeof globalThis.fetch;
  evolveMockState?: (nowMs?: number) => OpsState;
  /** Artificial delay in mock mode so loading UI is exercisable (default 40). */
  mockDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKeyFor(config: OpsConfig): string {
  return `${config.mode}:${config.baseUrl || "/"}`;
}

function createMockSource(
  config: OpsConfig,
  deps: OpsStateSourceDeps,
): OpsStateSource {
  const evolve = deps.evolveMockState ?? evolveMockState;
  const sleep = deps.sleep ?? defaultSleep;
  const delayMs = deps.mockDelayMs ?? 40;

  return {
    mode: "mock",
    pollMs: config.pollMs,
    cacheKey: cacheKeyFor(config),
    async load() {
      if (delayMs > 0) await sleep(delayMs);
      return evolve();
    },
  };
}

function createHttpSource(
  config: OpsConfig,
  deps: OpsStateSourceDeps,
): OpsStateSource {
  const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis);

  return {
    mode: "live",
    pollMs: config.pollMs,
    cacheKey: cacheKeyFor(config),
    async load() {
      const url = `${config.baseUrl}/api/state`;
      const response = await fetchFn(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`ops state HTTP ${response.status}`);
      }
      return (await response.json()) as OpsState;
    },
  };
}

/**
 * Build an ops state source from config.
 * Mode selects the adapter; deps override I/O for tests.
 */
export function createOpsStateSource(
  config: OpsConfig,
  deps: OpsStateSourceDeps = {},
): OpsStateSource {
  if (config.mode === "mock") {
    return createMockSource(config, deps);
  }
  return createHttpSource(config, deps);
}

/** App-wide source from Vite env (lazy singleton). */
let appSource: OpsStateSource | undefined;

export function getOpsStateSource(): OpsStateSource {
  if (!appSource) {
    appSource = createOpsStateSource(loadOpsConfig());
  }
  return appSource;
}

/** Reset singleton (tests / HMR). Prefer createOpsStateSource in unit tests. */
export function resetOpsStateSource(): void {
  appSource = undefined;
}
