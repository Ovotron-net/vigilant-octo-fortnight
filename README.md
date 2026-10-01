# IBN Dashboard OPS Console

Extractable React 19 + TanStack operator UI for the sensor’s read-only
`GET /api/state` snapshot. The embedded zero-deps dashboard in the Python
package remains the air-gapped fallback.

## Stack

- Vite + React 19
- TanStack Query (2s poll, `keepPreviousData`)
- TanStack Router (overview / episodes / evidence / rules)
- Custom data tables + TanStack Virtual (sortable/filterable lists)
- Live rate charts from **totals deltas** between polls (SVG, no chart library)

Rates: each successful `/api/state` poll appends a totals sample; the UI derives
units/second as `(Δcounter / Δt)`. Metric cards show the latest rate + sparkline;
overview has multi-series traffic and episode charts. Mock mode evolves counters
so charts move without a live sensor.

## Quick start (mock — no sensor required)

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173 — default development mode uses the fixture under
`src/api/mock/state.fixture.json`.

## Live sensor (proxy)

Ops listener is loopback-only and has no CORS headers. Use the Vite proxy:

```bash
# sensor ops on 127.0.0.1:9109
npm run dev:live
```

`dev:live` sets `VITE_USE_MOCK=false` and proxies `/api/state` to
`http://127.0.0.1:9109`.

Optional env:

| Variable | Meaning |
|---|---|
| `VITE_USE_MOCK` | `true` → fixture; `false` → fetch `/api/state` |
| `VITE_OPS_BASE_URL` | Absolute base (usually empty when using proxy) |
| `VITE_POLL_MS` | Poll interval (default `2000`) |
| `VITE_OPS_PROXY_TARGET` | Vite proxy target (default `http://127.0.0.1:9109`) |

## Scripts

```bash
npm run dev          # mock by default (.env.development)
npm run dev:mock     # force mock mode
npm run dev:live     # proxy to local sensor
npm run typecheck
npm run test
npm run test:watch
npm run build
npm run preview
```

## Documentation

Start with the [documentation index](./docs/README.md):

- [operator guide](./docs/operator-guide.md)
- [configuration and deployment](./docs/configuration.md)
- [`GET /api/state` contract](./docs/api/ops-state.md)
- [architecture](./docs/architecture.md)
- [development and contract-sync workflow](./docs/development.md)

Types live in `src/api/types.ts`; runtime acceptance is defined by
`src/api/validateOpsState.ts`.

## Security

The sensor ops listener has no built-in authentication. Keep it loopback-only
and use an authenticated reverse proxy or SSH tunnel for remote access. See
[configuration and deployment](./docs/configuration.md#production-deployment).
