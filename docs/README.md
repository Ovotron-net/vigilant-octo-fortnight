# Ops console documentation

This documentation describes the standalone code in this repository.

| Document | Use it for |
|---|---|
| [Operator guide](./operator-guide.md) | Pages, status indicators, tables, metrics, and troubleshooting |
| [Configuration and deployment](./configuration.md) | Vite modes, environment variables, proxying, and production hosting |
| [`GET /api/state` contract](./api/ops-state.md) | The JSON shape accepted by the console |
| [Architecture](./architecture.md) | Polling, validation, rate history, routing, and table internals |
| [Development](./development.md) | Commands, tests, and keeping the console aligned with the sensor |

For installation and the shortest mock/live startup instructions, see the
repository [README](../README.md).

## Source-of-truth order

When documentation and code disagree, use these implementation sources:

1. `src/api/validateOpsState.ts` for the JSON accepted at runtime.
2. `src/api/config.ts` and `vite.config.ts` for runtime and proxy configuration.
3. `src/api/mock/state.fixture.json` for a complete example snapshot.
4. `src/api/types.ts` for TypeScript-facing data types.

Update the relevant document whenever one of those files changes.
