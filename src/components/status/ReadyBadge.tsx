export function ReadyBadge({
  ready,
  state,
  connectionError,
}: {
  ready?: boolean;
  state?: string;
  connectionError?: boolean;
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
  return (
    <span className={`status ${cls}`} role="status">
      {label}
    </span>
  );
}
