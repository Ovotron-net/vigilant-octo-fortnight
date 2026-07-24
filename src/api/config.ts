/**
 * Ops console runtime config (from Vite env).
 * Callers learn: mode, baseUrl, pollMs — not individual env var names.
 */

export type OpsMode = "mock" | "live";

export type OpsConfig = {
  mode: OpsMode;
  /** Absolute base for the sensor, or "" when using the Vite proxy. */
  baseUrl: string;
  /** Poll interval in ms (clamped ≥ 500). */
  pollMs: number;
};

/** Subset of import.meta.env used for ops config (injectable in tests). */
export type OpsEnv = {
  VITE_USE_MOCK?: string;
  VITE_OPS_BASE_URL?: string;
  VITE_POLL_MS?: string;
};

const DEFAULT_POLL_MS = 2000;
const MIN_POLL_MS = 500;

/**
 * Load and normalize ops config from env-like values.
 * Defaults: live mode, empty base URL, 2000ms poll.
 */
export function loadOpsConfig(env: OpsEnv = import.meta.env): OpsConfig {
  const mode: OpsMode = env.VITE_USE_MOCK === "true" ? "mock" : "live";

  const configured = env.VITE_OPS_BASE_URL;
  const baseUrl =
    typeof configured === "string" && configured.length > 0
      ? configured.replace(/\/$/, "")
      : "";

  const raw = env.VITE_POLL_MS;
  const parsed = raw ? Number(raw) : DEFAULT_POLL_MS;
  const pollMs =
    Number.isFinite(parsed) && parsed >= MIN_POLL_MS ? parsed : DEFAULT_POLL_MS;

  return { mode, baseUrl, pollMs };
}
