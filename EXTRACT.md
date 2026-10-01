# Standalone repository and sensor integration

This repository is the extracted, self-contained ops console. The Python
sensor does not depend on it.

## Pair with a sensor

1. Pin the API contract:
   - Keep `src/api/mock/state.fixture.json` as a golden example.
   - Note the ibn-monitor release / commit you last verified against.
   - Follow the [contract-sync workflow](./docs/development.md#contract-synchronization).
2. CI suggestion:

   ```yaml
   - run: npm ci
   - run: npm run typecheck
   - run: npm run test
   - run: npm run build
   ```

3. Deploy as static files behind a reverse proxy that can reach the sensor
   ops listener (or use SSH tunnel + local static server). Do **not** expose
   the sensor ops port without an authenticated proxy — the listener has no
   built-in auth.

See [configuration and deployment](./docs/configuration.md) and the
[`GET /api/state` contract](./docs/api/ops-state.md).

## What stays in ibn-monitor

- AF_PACKET pipeline, journal, webhooks, nftables render
- Embedded `dashboard.py` SPA at `GET /`
- `GET /api/state` JSON contract

## Optional later

- Multi-sensor base URL picker
- Serving `dist/` from Python `OperationsServer` (product decision; not default)
