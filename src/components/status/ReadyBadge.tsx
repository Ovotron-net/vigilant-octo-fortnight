export function ReadyBadge({
  ready,
  state,
  connectionError,
  reasons,
}: {
  ready?: boolean;
  state?: string;
  connectionError?: boolean;
  reasons?: readonly string[];
}) {
  if (connectionError) {
    return (
      <span className="status status--stale" role="status">
        connection lost
      </span>
    );
  }
  const label = state || (ready ? "ready" : "not ready");
  const cls =
    ready ? "status--ok" : state === "degraded" ? "status--stale" : "status--down";
  const reasonText =
    !ready && reasons && reasons.length > 0
      ? reasons.length === 1
        ? reasons[0]
        : `${reasons[0]} (+${reasons.length - 1})`
      : undefined;

  return (
    <span
      className={`status ${cls}`}
      role="status"
      title={reasons?.length ? reasons.join("; ") : undefined}
    >
      {label}
      {reasonText ? (
        <span className="status__reason"> — {reasonText}</span>
      ) : null}
    </span>
  );
}
