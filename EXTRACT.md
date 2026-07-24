# Extracting the ops console to its own repository

This folder is self-contained. The Python sensor does not depend on it.

## Steps

1. Create a new git repository.
2. Copy the entire `ops-console/` directory contents to the new repo root
   (not nested under `ops-console/`).
3. Adjust README links that point at `../docs/operator/ops-state-api.md`
   (copy that doc or link to the sensor release).
4. Pin the API contract:
   - Keep `src/api/mock/state.fixture.json` as a golden example.
   - Note the ibn-monitor release / commit you last verified against.
5. CI suggestion:

   ```yaml
   - run: npm ci
   - run: npm run typecheck
   - run: npm run test
   - run: npm run build
   ```

6. Deploy as static files behind a reverse proxy that can reach the sensor
   ops listener (or use SSH tunnel + local static server). Do **not** expose
   the sensor ops port without an authenticated proxy — the listener has no
   built-in auth.

## What stays in ibn-monitor

- AF_PACKET pipeline, journal, webhooks, nftables render
- Embedded `dashboard.py` SPA at `GET /`
- `GET /api/state` JSON contract

## Optional later

- Multi-sensor base URL picker
- Serving `dist/` from Python `OperationsServer` (product decision; not default)
