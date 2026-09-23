import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState } from "@/components/common/EmptyState";
import { TruncationHint } from "@/components/common/TruncationHint";
import { gridTemplateFromColumns, runOpsListPipeline } from "./pipeline";
import type { OpsColumn, OpsDataTableProps } from "./types";

const ROW_H = 36;
/** Enter virtual layout above this visible row count. */
const VIRTUAL_ENTER = 12;
/** Exit virtual layout at or below this count (hysteresis vs ENTER). */
const VIRTUAL_EXIT = 8;
const DEFAULT_COMPACT_LIMIT = 8;

function defaultCell<T>(col: OpsColumn<T>, row: T): ReactNode {
  if (col.cell) return col.cell(row);
  const v = col.value(row);
  return v == null ? "" : String(v);
}

/**
 * Deep module: operator list chrome (sort, filter, facet, compact, empty,
 * truncation, virtual vs HTML table). Domain tables supply columns + copy only.
 */
export function OpsDataTable<T>(props: OpsDataTableProps<T>) {
  const {
    rows,
    columns,
    getRowId,
    compact = false,
    emptyMessage,
    filteredEmptyMessage = "No rows match the current filter.",
    truncated = false,
    truncationLabel,
    filterPlaceholder,
    filterAriaLabel,
    facet,
    initialSort,
    compactLimit = DEFAULT_COMPACT_LIMIT,
    preferStatic = false,
    summary,
  } = props;

  const [filter, setFilter] = useState("");
  const [facetValue, setFacetValue] = useState("");
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>(() =>
    initialSort
      ? { id: initialSort.id, desc: initialSort.desc ?? false }
      : null,
  );
  const [virtualSticky, setVirtualSticky] = useState(false);

  // First pass: rows only (virtual decision depends on row count, not cols).
  const rowPipeline = useMemo(
    () =>
      runOpsListPipeline({
        rows,
        columns,
        facet,
        facetValue,
        globalFilter: filter,
        sort,
        compact,
        compactLimit,
        virtualLayout: false,
      }),
    [rows, columns, facet, facetValue, filter, sort, compact, compactLimit],
  );

  useEffect(() => {
    if (preferStatic || compact) {
      setVirtualSticky(false);
      return;
    }
    const n = rowPipeline.visible.length;
    setVirtualSticky((prev) => {
      if (n > VIRTUAL_ENTER) return true;
      if (n <= VIRTUAL_EXIT) return false;
      return prev;
    });
  }, [rowPipeline.visible.length, preferStatic, compact]);

  const useVirtual = !preferStatic && !compact && virtualSticky;

  const pipeline = useMemo(
    () =>
      runOpsListPipeline({
        rows,
        columns,
        facet,
        facetValue,
        globalFilter: filter,
        sort,
        compact,
        compactLimit,
        virtualLayout: useVirtual,
      }),
    [
      rows,
      columns,
      facet,
      facetValue,
      filter,
      sort,
      compact,
      compactLimit,
      useVirtual,
    ],
  );

  const visible = pipeline.visible;
  const visCols = pipeline.columns;
  const gridTemplate = gridTemplateFromColumns(visCols);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: useVirtual ? visible.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
  });

  const toggleSort = (col: OpsColumn<T>) => {
    if (col.sortable === false) return;
    setSort((prev) => {
      if (!prev || prev.id !== col.id) return { id: col.id, desc: false };
      if (!prev.desc) return { id: col.id, desc: true };
      return null;
    });
  };

  const onSortKeyDown = (
    e: KeyboardEvent,
    col: OpsColumn<T>,
  ) => {
    if (col.sortable === false) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSort(col);
    }
  };

  const sortMark = (colId: string) => {
    if (!sort || sort.id !== colId) return null;
    return sort.desc ? " ↓" : " ↑";
  };

  const sortAria = (colId: string): "ascending" | "descending" | undefined => {
    if (!sort || sort.id !== colId) return undefined;
    return sort.desc ? "descending" : "ascending";
  };

  const showToolbar = !compact && (filterPlaceholder || facet);

  const truncation = truncated && truncationLabel ? (
    <TruncationHint truncated label={truncationLabel} />
  ) : null;

  const toolbar = showToolbar ? (
    <div className="toolbar">
      {filterPlaceholder ? (
        <input
          type="search"
          placeholder={filterPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label={filterAriaLabel ?? filterPlaceholder}
        />
      ) : null}
      {facet ? (
        <select
          value={facetValue}
          onChange={(e) => setFacetValue(e.target.value)}
          aria-label={facet.ariaLabel}
        >
          <option value="">{facet.allLabel ?? "All"}</option>
          {facet.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  ) : null;

  if (rows.length === 0) {
    return (
      <div>
        {truncation}
        <div className="table-wrap">
          <EmptyState>{emptyMessage}</EmptyState>
        </div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div>
        {truncation}
        {toolbar}
        <div className="table-wrap">
          <EmptyState>{filteredEmptyMessage}</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div>
      {truncation}
      {toolbar}

      {useVirtual ? (
        <div className="table-wrap" role="table">
          <div role="rowgroup">
            <div
              className="virtual-header"
              style={{ gridTemplateColumns: gridTemplate }}
              role="row"
            >
              {visCols.map((col) => (
                <div
                  key={col.id}
                  role="columnheader"
                  tabIndex={col.sortable === false ? undefined : 0}
                  aria-sort={
                    col.sortable === false ? undefined : sortAria(col.id)
                  }
                  className={col.sortable === false ? undefined : "sortable"}
                  onClick={() => toggleSort(col)}
                  onKeyDown={(e) => onSortKeyDown(e, col)}
                  style={{
                    cursor: col.sortable === false ? undefined : "pointer",
                  }}
                >
                  {col.header}
                  {sortMark(col.id)}
                </div>
              ))}
            </div>
          </div>
          <div
            ref={parentRef}
            className="table-scroll"
            role="rowgroup"
            style={{ maxHeight: "28rem" }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
                width: "100%",
              }}
            >
              {virtualizer.getVirtualItems().map((vRow) => {
                const row = visible[vRow.index]!;
                return (
                  <div
                    key={getRowId(row)}
                    className="virtual-row"
                    role="row"
                    style={{
                      gridTemplateColumns: gridTemplate,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: vRow.size,
                      transform: `translateY(${vRow.start}px)`,
                    }}
                  >
                    {visCols.map((col) => (
                      <div key={col.id} role="cell">
                        {defaultCell(col, row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  {visCols.map((col) => (
                    <th
                      key={col.id}
                      className={
                        col.sortable === false ? undefined : "sortable"
                      }
                      tabIndex={col.sortable === false ? undefined : 0}
                      aria-sort={
                        col.sortable === false ? undefined : sortAria(col.id)
                      }
                      onClick={() => toggleSort(col)}
                      onKeyDown={(e) => onSortKeyDown(e, col)}
                    >
                      {col.header}
                      {sortMark(col.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={getRowId(row)}>
                    {visCols.map((col) => (
                      <td key={col.id}>{defaultCell(col, row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!compact && summary ? (
        <p className="empty" style={{ paddingTop: "0.5rem" }}>
          {summary({
            visibleCount: visible.length,
            totalCount: rows.length,
            facetValue,
          })}
        </p>
      ) : null}
    </div>
  );
}
