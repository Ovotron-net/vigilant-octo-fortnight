# ibn-monitor ops console

Extractable React 19 + TanStack operator UI for the sensor’s read-only
`GET /api/state` snapshot. The embedded zero-deps dashboard in the Python
package remains the air-gapped fallback.

## Stack

- Vite + React 19
- TanStack Query (2s poll, `keepPreviousData`)
- TanStack Router (overview / episodes / evidence / rules)
- TanStack Table + Virtual (sortable/filterable lists)
- Live rate charts from **totals deltas** between polls (SVG, no chart library)

Rates: each successful `/api/state` poll appends a totals sample; the UI derives
units/second as `(Δcounter / Δt)`. Metric cards show the latest rate + sparkline;
overview has multi-series traffic and episode charts. Mock mode evolves counters
so charts move without a live sensor.

## Quick start (mock — no sensor required)

```bash
cd ops-console
npm install
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

`dev:live` sets `VITE_USE_MOCK=false` and proxies `/api` → `http://127.0.0.1:9109`.

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
npm run build
npm run preview
```

## Contract

Types live in `src/api/types.ts` and mirror
`ibn_monitor.read_model.ReadModel.view()`. See also
`../docs/operator/ops-state-api.md`.

## Extract to its own repo

See [EXTRACT.md](./EXTRACT.md).
