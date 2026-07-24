import { describe, expect, it } from "vitest";
import {
  enforcementLabel,
  flowLabel,
  formatNumber,
  formatRate,
  portsLabel,
} from "./format";

describe("format helpers", () => {
  it("formats numbers", () => {
    expect(formatNumber(1234)).toMatch(/1.?234/);
  });

  it("formats rates", () => {
    expect(formatRate(0)).toBe("0/s");
    expect(formatRate(42.2)).toBe("42/s");
    expect(formatRate(1500)).toBe("1.50k/s");
    expect(formatRate(null)).toBe("—");
  });

  it("labels ports", () => {
    expect(portsLabel("any")).toBe("any");
    expect(portsLabel([22, 443])).toBe("22, 443");
    expect(portsLabel(null)).toBe("any");
  });

  it("labels flows", () => {
    expect(flowLabel("10.0.0.1", "1.2.3.4", "tcp", 22)).toBe(
      "10.0.0.1 → 1.2.3.4 tcp/22",
    );
  });

  it("labels enforcement", () => {
    expect(enforcementLabel("nftables_drop_candidate")).toBe("drop");
    expect(enforcementLabel("none")).toBe("none");
  });
});
