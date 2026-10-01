# Development

Install exactly the locked dependencies and start mock mode:

```bash
npm ci
npm run dev
```

Mock mode requires no sensor. It evolves a cloned golden fixture so counters
and charts move while preserving the contract shape.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development mode; mock data by default |
| `npm run dev:mock` | Explicit mock mode |
| `npm run dev:live` | Live mode with the local `/api/state` proxy |
| `npm run typecheck` | TypeScript checks without output |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Type-check and create `dist/` |
| `npm run preview` | Serve the production build locally |

Tests run in the Node environment and match `src/**/*.test.ts`.

## Main seams

- `loadOpsConfig(env)` accepts injectable environment values.
- `createOpsStateSource(config, deps)` accepts substitute fetch, mock evolution,
  delay, and sleep functions.
- `resetOpsStateSource()` clears the app singleton for tests or hot reload.
- `resetMockEvolve()` resets module-level mock evolution.
- Data-table filtering and sorting live in a pure pipeline.

Prefer these seams over patching browser globals in tests.

## Contract synchronization

The console consumes a contract owned by the ibn-monitor sensor. When the
sensor changes `ReadModel.view()`:

1. update `src/api/types.ts`;
2. update runtime parsing in `src/api/validateOpsState.ts`;
3. replace or extend `src/api/mock/state.fixture.json` with a real compatible
   snapshot;
4. update validator, source, and rendering tests;
5. update `docs/api/ops-state.md`;
6. run the full verification sequence below; and
7. record the sensor release or commit used for compatibility in release
   notes.

Do not update TypeScript types without the runtime parser. The UI receives the
parser's normalized output, and unparsed fields are discarded even if a type
declares them.

## Verification

Run:

```bash
npm ci
npm run typecheck
npm run test
npm run build
```

For a sensor contract change, also run `npm run dev:live` against the target
sensor and check all four routes. For UI-only work, use mock mode to verify
loading, counters, rates after the second poll, filters, sorting, and route
navigation.
