import { describe, expect, it } from "vitest";
import { gridTemplateFromColumns, runOpsListPipeline } from "./pipeline";
import type { OpsColumn, OpsFacet } from "./types";

type Row = { id: string; severity: string; n: number };

const columns: OpsColumn<Row>[] = [
  { id: "id", header: "ID", value: (r) => r.id },
  { id: "severity", header: "Sev", value: (r) => r.severity },
  { id: "n", header: "N", value: (r) => r.n, hideWhenCompact: true, width: "4rem" },
];

const facet: OpsFacet<Row> = {
  ariaLabel: "sev",
  options: [{ value: "high", label: "high" }],
  match: (r, v) => r.severity === v,
};

const rows: Row[] = [
  { id: "a", severity: "low", n: 1 },
  { id: "b", severity: "high", n: 3 },
  { id: "c", severity: "high", n: 2 },
];

describe("runOpsListPipeline", () => {
  it("applies facet then global filter", () => {
    const { visible } = runOpsListPipeline({
      rows,
      columns,
      facet,
      facetValue: "high",
      globalFilter: "b",
      sort: null,
      compact: false,
      compactLimit: 8,
      virtualLayout: false,
    });
    expect(visible.map((r) => r.id)).toEqual(["b"]);
  });

  it("sorts then slices for compact (interesting top)", () => {
    const { visible, columns: cols } = runOpsListPipeline({
      rows,
      columns,
      facetValue: "",
      globalFilter: "",
      sort: { id: "n", desc: true },
      compact: true,
      compactLimit: 2,
      virtualLayout: false,
    });
    expect(visible.map((r) => r.id)).toEqual(["b", "c"]);
    expect(cols.map((c) => c.id)).toEqual(["id", "severity"]);
  });

  it("drops hideWhenVirtual columns only on virtual layout", () => {
    const cols: OpsColumn<Row>[] = [
      ...columns,
      {
        id: "seq",
        header: "Seq",
        value: (r) => r.n,
        hideWhenVirtual: true,
      },
    ];
    const virtual = runOpsListPipeline({
      rows,
      columns: cols,
      facetValue: "",
      globalFilter: "",
      sort: null,
      compact: false,
      compactLimit: 8,
      virtualLayout: true,
    });
    expect(virtual.columns.map((c) => c.id)).not.toContain("seq");
  });

  it("string-sorts case-insensitively with numeric awareness", () => {
    const { visible } = runOpsListPipeline({
      rows: [
        { id: "10", severity: "x", n: 0 },
        { id: "2", severity: "x", n: 0 },
      ],
      columns,
      facetValue: "",
      globalFilter: "",
      sort: { id: "id", desc: false },
      compact: false,
      compactLimit: 8,
      virtualLayout: false,
    });
    expect(visible.map((r) => r.id)).toEqual(["2", "10"]);
  });
});

describe("gridTemplateFromColumns", () => {
  it("joins explicit widths", () => {
    expect(
      gridTemplateFromColumns([
        { id: "a", header: "A", value: () => 1, width: "9rem" },
        { id: "b", header: "B", value: () => 1, width: "1fr" },
      ]),
    ).toBe("9rem 1fr");
  });
});
