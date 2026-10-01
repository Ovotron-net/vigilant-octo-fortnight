# Architecture

The application is a static React single-page app with two interchangeable
read-only data sources.

```text
Vite environment
      |
      v
loadOpsConfig -> OpsStateSource ---- mock ----> evolving fixture
                      |
                      +------------- live ----> GET /api/state
                                                   |
                                                   v
                                             parseOpsState
                                                   |
                                                   v
TanStack Query -> AppShell -> route pages -> cards, charts, and tables
```

## Data source and validation

`src/api/config.ts` normalizes the Vite environment into `mode`, `baseUrl`, and
`pollMs`. `src/api/opsStateSource.ts` selects:

- a mock adapter that evolves counters from
  `src/api/mock/state.fixture.json` after a small artificial delay; or
- an HTTP adapter that fetches `${baseUrl}/api/state`.

The app uses one lazily-created source instance. Its mode and base URL form
part of the React Query cache key.

Live JSON passes through `parseOpsState` before entering React. The validator
checks every nested array element and returns a normalized `OpsState`; malformed
rows therefore fail the whole snapshot instead of failing later during render.
See the [contract](./api/ops-state.md).

## Polling and stale data

`src/hooks/useOpsState.ts` is the React Query integration. It polls at the
configured interval, retries once, and uses `keepPreviousData`. As a result, an
initial error blocks data pages, while an error after a successful poll leaves
the last valid snapshot visible.

`AppShell` owns the query and renders shared readiness and error state. Route
pages call the same keyed query and receive the cached snapshot rather than
creating independent API contracts.

## Rates

`TotalsHistoryProvider` lives above the router outlet, allowing rate history to
survive page navigation. `useTotalsHistory` stores up to 90 successful totals
samples, and `src/lib/rates.ts` calculates per-second counter deltas.

The chart and sparkline components render SVG directly. No charting dependency
or server-side aggregation is involved.

## Routing

`src/router.tsx` defines four TanStack Router routes:

```text
/           OverviewPage
/episodes   EpisodesPage
/evidence   EvidencePage
/rules      RulesPage
```

Production static hosting must provide an `index.html` fallback for direct
requests to non-root routes.

## Data tables

`src/components/common/ops-data-table` owns filtering, facet selection,
sorting, compact limits, empty states, truncation notices, and virtual/static
rendering. Domain components define only their columns, labels, and defaults:

- `EpisodesTable`
- `EvidenceTable`
- `RulesTable`

The pipeline is framework-light and tested separately from React rendering in
`pipeline.test.ts`.

## Import alias

Both TypeScript and Vite map `@/` to `src/`. Keep `tsconfig.json` and
`vite.config.ts` aligned when changing this alias.
