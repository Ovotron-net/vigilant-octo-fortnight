import type { OpsCellValue, OpsColumn, OpsFacet } from "./types";

export type PipelineInput<T> = {
  rows: readonly T[];
  columns: readonly OpsColumn<T>[];
  facet?: OpsFacet<T>;
  facetValue: string;
  globalFilter: string;
  sort: { id: string; desc: boolean } | null;
  compact: boolean;
  compactLimit: number;
  /** When true, drop hideWhenVirtual columns from the column set. */
  virtualLayout: boolean;
};

export type PipelineResult<T> = {
  /** Rows after facet + filter + sort + compact. */
  visible: T[];
  /** Columns after presentation hide. */
  columns: OpsColumn<T>[];
};

function cellString(v: OpsCellValue): string {
  if (v == null) return "";
  return String(v);
}

function compareValues(a: OpsCellValue, b: OpsCellValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return cellString(a).localeCompare(cellString(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Pure list pipeline: facet → global filter → sort → compact slice → column hide.
 * Sort-before-slice makes compact peeks show the “interesting” top (e.g. newest evidence).
 */
export function runOpsListPipeline<T>(input: PipelineInput<T>): PipelineResult<T> {
  let rows = input.rows as T[];

  if (input.facet && input.facetValue) {
    const { match } = input.facet;
    const selected = input.facetValue;
    rows = rows.filter((r) => match(r, selected));
  }

  const filter = input.globalFilter.trim().toLowerCase();
  if (filter) {
    rows = rows.filter((row) =>
      input.columns.some((col) =>
        cellString(col.value(row)).toLowerCase().includes(filter),
      ),
    );
  }

  if (input.sort) {
    const col = input.columns.find((c) => c.id === input.sort!.id);
    if (col) {
      const desc = input.sort.desc;
      rows = [...rows].sort((ra, rb) => {
        const cmp = compareValues(col.value(ra), col.value(rb));
        return desc ? -cmp : cmp;
      });
    }
  }

  if (input.compact) {
    rows = rows.slice(0, input.compactLimit);
  }

  let columns = [...input.columns];
  if (input.compact) {
    columns = columns.filter((c) => !c.hideWhenCompact);
  }
  if (input.virtualLayout) {
    columns = columns.filter((c) => !c.hideWhenVirtual);
  }

  return { visible: rows, columns };
}

export function gridTemplateFromColumns<T>(
  columns: readonly OpsColumn<T>[],
): string {
  if (columns.length === 0) return "1fr";
  if (columns.every((c) => c.width)) {
    return columns.map((c) => c.width!).join(" ");
  }
  return columns.map((c) => c.width ?? "1fr").join(" ");
}
