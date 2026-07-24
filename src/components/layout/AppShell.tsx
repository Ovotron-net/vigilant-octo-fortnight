import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useOpsState } from "@/hooks/useOpsState";
import { ReadyBadge } from "@/components/status/ReadyBadge";
import { getOpsStateSource } from "@/api/opsStateSource";
import { formatRelativeAge } from "@/lib/time";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/episodes", label: "Episodes" },
  { to: "/evidence", label: "Evidence" },
  { to: "/rules", label: "Rules" },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const query = useOpsState();
  const source = getOpsStateSource();
  const op = query.data?.operational;
  const dataUpdatedAt = query.dataUpdatedAt;
  const ageMs = dataUpdatedAt ? Date.now() - dataUpdatedAt : null;

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="app-header">
        <div className="app-header__island">
          <div className="app-header__brand">
            <span className="app-header__eyebrow">ops</span>
            <h1>ibn-monitor</h1>
            <ReadyBadge
              ready={op?.ready}
              state={op?.state}
              connectionError={query.isError && !query.data}
            />
          </div>

          <nav className="app-nav" aria-label="Primary">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? "active" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="meta">
            {op?.sensor_id ? (
              <span className="mono">{op.sensor_id}</span>
            ) : null}
            {op?.policy_revision ? (
              <span title="policy revision">rev {op.policy_revision}</span>
            ) : null}
            <span title="last successful fetch">
              {formatRelativeAge(ageMs)}
            </span>
            <span>
              {source.mode} · {source.pollMs}ms
            </span>
            {query.isFetching ? <span>sync…</span> : null}
            {query.isError && query.data ? (
              <span className="status status--stale">poll error</span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="app-main">
        {query.isError && !query.data ? (
          <div className="banner banner--error" role="alert">
            Cannot reach <code>/api/state</code>. Start the sensor ops listener
            or run mock mode (<code>npm run dev</code>).
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
