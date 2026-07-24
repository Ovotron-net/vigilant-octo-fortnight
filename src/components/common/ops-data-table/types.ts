import type { ReactNode } from "react";

/** Value used for sort + global text filter. */
export type OpsCellValue = string | number | boolean | null | undefined;

export type OpsColumn<T> = {
  /** Stable id for sort and column hide. */
  id: string;
  header: string;
  /** Sort/filter value — module never needs TanStack accessorKey. */
  value: (row: T) => OpsCellValue;
  /** Render; default: String(value(row) ?? ""). */
  cell?: (row: T) => ReactNode;
  /** Default true. */
  sortable?: boolean;
  /** Drop when compact (e.g. Evidence "Seq"). */
  hideWhenCompact?: boolean;
  /** Drop on virtual CSS-grid path only (HTML table still shows it). */
  hideWhenVirtual?: boolean;
  /**
   * CSS track for virtual grid (e.g. "9rem", "1.6fr").
   * Falls back to `1fr` when omitted.
   */
  width?: string;
};

export type OpsFacet<T> = {
  ariaLabel: string;
  /** Domain options (module prepends "all" sentinel with value ""). */
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Called only when selected value is non-empty. */
  match: (row: T, selected: string) => boolean;
  /** Label for the all/reset option. Default "All". */
  allLabel?: string;
};

export type OpsDataTableProps<T> = {
  rows: readonly T[];
  columns: readonly OpsColumn<T>[];
  getRowId: (row: T) => string;

  compact?: boolean;
  emptyMessage: ReactNode;

  truncated?: boolean;
  truncationLabel?: string;

  /** When set and !compact, show search. */
  filterPlaceholder?: string;
  filterAriaLabel?: string;

  facet?: OpsFacet<T>;

  initialSort?: { id: string; desc?: boolean };

  /** Compact peek size after sort. Default 8. */
  compactLimit?: number;

  /**
   * Never use virtual CSS grid (Rules-sized tables that prefer semantic HTML).
   * Default false — virtualize when !compact && visible rows > threshold.
   */
  preferStatic?: boolean;

  summary?: (ctx: {
    visibleCount: number;
    totalCount: number;
    facetValue: string;
  }) => ReactNode;
};
