# Configuration and deployment

Vite reads configuration at startup in development and embeds it at build time
for production. Restart the dev server after changing an environment file.
Rebuild static assets after changing production values.

## Modes

| Command | Vite mode | Data source |
|---|---|---|
| `npm run dev` | `development` | Evolving mock fixture |
| `npm run dev:mock` | `mock` | Evolving mock fixture |
| `npm run dev:live` | `live` | Live `GET /api/state` |
| `npm run build` | `production` | Live by default |
| `npm run preview` | `production` | Live by default, with the local proxy available |

The committed `.env.development`, `.env.mock`, and `.env.live` files select
the first three behaviors. There is no committed `.env.production`, so a
normal production build uses live mode, a relative endpoint, and a 2000 ms
poll interval.

## Environment variables

| Variable | Default | Behavior |
|---|---|---|
| `VITE_USE_MOCK` | not set (`live`) | Only the exact string `true` selects mock mode |
| `VITE_OPS_BASE_URL` | empty | Prefix for `/api/state`; a single trailing slash is removed |
| `VITE_POLL_MS` | `2000` | Poll interval in milliseconds; non-finite values and values below `500` fall back to `2000` |
| `VITE_OPS_PROXY_TARGET` | `http://127.0.0.1:9109` | Vite dev/preview proxy target; not read by browser runtime code |

Examples:

```bash
# Use the local Vite proxy.
VITE_USE_MOCK=false npm run dev:live

# Build assets that request an absolute sensor base.
VITE_OPS_BASE_URL=https://ops.example.internal npm run build
```

An absolute base URL makes the browser request
`https://ops.example.internal/api/state`. That server must permit the static
site's origin with CORS headers. A same-origin reverse proxy is usually
simpler.

## Development proxy

Vite proxies only `/api/state`:

```text
browser /api/state -> VITE_OPS_PROXY_TARGET/api/state
```

The default target assumes the sensor ops listener is available at
`127.0.0.1:9109`. `changeOrigin` is enabled. Other `/api/*` paths are not
proxied.

## Production deployment

`npm run build` writes static assets to `dist/`. Host that directory and:

1. serve `index.html` for the SPA routes `/episodes`, `/evidence`, and `/rules`;
2. reverse-proxy same-origin `/api/state` to the sensor; and
3. prevent public, unauthenticated access to the sensor response.

The sensor ops listener has no built-in authentication. Keep port 9109
loopback-only or on a private network. Put authentication and TLS at the
reverse proxy, or use an SSH tunnel for local operator access.

A minimal proxy topology is:

```text
operator browser --HTTPS/auth--> static host + /api/state proxy
                                      |
                                      +--> 127.0.0.1:9109/api/state
```

Do not expose the listener directly to the internet.

## Polling behavior

The console:

- polls at `VITE_POLL_MS` while the page is active;
- does not continue interval polling in a background tab;
- retries a failed request once;
- retains the previous valid snapshot while a later poll fails; and
- may refetch when the window regains focus through TanStack Query defaults.

Every live request sends `Accept: application/json` and uses `cache:
"no-store"`.
