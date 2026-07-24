export function TruncationHint({
  truncated,
  label,
}: {
  truncated: boolean;
  label: string;
}) {
  if (!truncated) return null;
  return (
    <p className="hint" role="status">
      Showing the latest capped set for {label}; additional rows are truncated on
      the sensor.
    </p>
  );
}
