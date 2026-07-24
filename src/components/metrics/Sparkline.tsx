import { useId, useMemo } from "react";
import { sparklinePath } from "@/lib/rates";

export function Sparkline({
  values,
  width = 120,
  height = 28,
  className,
  label,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const path = useMemo(
    () => sparklinePath(values, width, height),
    [values, width, height],
  );

  if (values.length === 0) {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      />
    );
  }

  const areaPath =
    path &&
    `${path} L ${width - 2} ${height - 2} L 2 ${height - 2} Z`;

  return (
    <svg
      className={className ?? "sparkline"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? "rate sparkline"}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath ? (
        <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
