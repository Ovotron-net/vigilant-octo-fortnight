import { describe, expect, it } from "vitest";
import { loadOpsConfig } from "./config";

describe("loadOpsConfig", () => {
  it("defaults to live, empty base, 2000ms poll", () => {
    expect(loadOpsConfig({})).toEqual({
      mode: "live",
      baseUrl: "",
      pollMs: 2000,
    });
  });

  it("enables mock when VITE_USE_MOCK is true", () => {
    expect(loadOpsConfig({ VITE_USE_MOCK: "true" }).mode).toBe("mock");
    expect(loadOpsConfig({ VITE_USE_MOCK: "false" }).mode).toBe("live");
  });

  it("strips trailing slash from base URL", () => {
    expect(
      loadOpsConfig({ VITE_OPS_BASE_URL: "http://sensor:9109/" }).baseUrl,
    ).toBe("http://sensor:9109");
  });

  it("clamps invalid poll intervals to default", () => {
    expect(loadOpsConfig({ VITE_POLL_MS: "100" }).pollMs).toBe(2000);
    expect(loadOpsConfig({ VITE_POLL_MS: "nope" }).pollMs).toBe(2000);
    expect(loadOpsConfig({ VITE_POLL_MS: "1500" }).pollMs).toBe(1500);
  });
});
