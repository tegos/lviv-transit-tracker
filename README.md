# Lviv Transit Tracker

[![CI](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-onrender.com-brightgreen)](https://lviv-transit-tracker.onrender.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

Real-time public transit tracker for Lviv, Ukraine. Pick bus, trolleybus and tram
routes on a Google Map and watch the vehicles move live, refreshed every 5 seconds.

**[Live demo](https://lviv-transit-tracker.onrender.com)** - no install required.
(Hosted on Render's free tier, so the first request after a period of inactivity
may take a few seconds to wake the server.)

<img src="assets/demo.webp" alt="Lviv Transit Tracker demo" width="800">

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running tests](#running-tests)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Roadmap and known limitations](#roadmap-and-known-limitations)
- [Background](#background)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Author](#author)

## Features

- Live vehicle positions on a Google Map, refreshed every 5 seconds
- Track many routes at once; each route gets its own color
- Route search/filter in the sidebar
- Smooth marker animation between position updates
- Auto-reconnect: re-subscribes your selected routes after a network drop
- Mobile sidebar with native horizontal-swipe gestures
- No jQuery, no Bootstrap; vanilla ES modules bundled by Vite

## How it works

The server fetches the available route list from `api.lad.lviv.ua` and renders it
into the sidebar. When you check a route, the browser emits a Socket.IO event. The
server sends the route path (which the browser draws on the map), then polls live
vehicle positions every 5 seconds and pushes each update to all subscribed clients.
Markers animate smoothly as positions change.

```text
1. Browser   checkbox toggle                  ->  emit route:subscribe(routeCode)
2. Server    GET /routes/static/:name         ->  emit route:path { routeCode, path }
3. Server    every 5s: GET /routes/dynamic/:name  ->  emit vehicles:update(vehicles, routeCode)
4. Browser   animate markers on the Google Map
```

A few things worth knowing about the implementation:

- **Self-scheduling poll loop.** The 5s loop schedules the next cycle only after
  the current one settles (not a bare `setInterval`), and fetches every active
  route concurrently with `Promise.allSettled`, so a slow upstream can never stack
  overlapping cycles and one failing route never sinks the batch.
- **Socket.IO rooms.** Each route code is a room; a vehicle update is encoded once
  and fanned out to every subscriber via `io.to(routeCode).emit(...)`.
- **Resilient client.** On every (re)connect the browser clears stale map state and
  re-subscribes the checked routes, because the server tracks subscriptions per
  socket and purges them on disconnect.
- **Hardening.** helmet security headers, per-socket subscribe rate limiting and
  route-code validation, restricted Socket.IO CORS, and a graceful SIGTERM drain
  for zero-downtime Render deploys.

HTTP endpoints: `GET /` (map), `GET /json` (route list), `GET /healthz` (liveness),
`GET /about`, `GET /contact`.

## Tech stack

- Node.js 20+, Express 5
- Socket.IO 4 (server + client)
- EJS 6 templates
- Vite 8 (frontend bundling; vanilla ES modules)
- Google Maps JavaScript API
- helmet (security headers), compression (gzip)
- Hand-written CSS (no Bootstrap/jQuery/Hammer)
- dotenv (environment config)

## Quick start

```bash
git clone https://github.com/tegos/lviv-transit-tracker.git
cd lviv-transit-tracker
npm install
cp .env.example .env
```

Set your Google Maps key in `.env` (see [Configuration](#configuration)), then:

```bash
npm start
```

`npm start` runs the Vite build first (`prestart`), then boots the server. Open
[http://localhost:3000](http://localhost:3000) and check any route in the sidebar
to track it on the map. For frontend iteration, `npm run dev` rebuilds the bundle
on change.

## Configuration

Configuration is read from environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `POLL_INTERVAL_MS` | `5000` | Vehicle-position polling interval in milliseconds |
| `GOOGLE_MAPS_KEY` | - | Google Maps JavaScript API key |
| `ALLOWED_ORIGINS` | - | Comma-separated browser origins allowed to open a Socket.IO connection. Empty falls back to the production URL in production and localhost in dev |
| `API_BASE_URL` | `https://api.lad.lviv.ua` | Base URL of the upstream Lviv transit REST API |
| `NODE_ENV` | - | `production` enables the production CORS default and hides error detail |

## Running tests

```bash
npm test               # unit + socket integration (offline, model stubbed)
npm run test:coverage  # same suite with a coverage report
INTEGRATION=1 npm test # also hit the live api.lad.lviv.ua
npm run test:e2e       # Playwright browser smoke tests
```

CI runs the Vite build, the test suite on Node 20/22/24, and `npm audit`.

## Deployment

The app deploys on [Render](https://render.com) as a `web` service (free plan) from
the committed `render.yaml` blueprint:

- Build: `npm ci && npm run build`
- Start: `node ./bin/www`
- Runtime pinned to `NODE_VERSION=22`
- Health check: `GET /healthz` (a no-I/O liveness probe, so it stays green even if
  the upstream transit API is down)

Set `GOOGLE_MAPS_KEY` in the Render dashboard (it is `sync: false`, never committed).

> **Custom domain / fork note:** Socket.IO only accepts connections from allowed
> origins. In production this defaults to `https://lviv-transit-tracker.onrender.com`.
> If you fork, rename the service, or attach a custom domain, set
> `ALLOWED_ORIGINS=https://your-domain` (comma-separated) or the live socket
> connection will be rejected.

## Troubleshooting

- **Blank or grey map on localhost.** The Google Maps key is referrer-restricted in
  the Google Cloud Console. Add `http://localhost:3000` to the key's allowed
  referrers, or the Maps JavaScript API fails silently. (This is also why a strict
  Content-Security-Policy is currently disabled; it cannot be verified locally
  without a working key.)
- **Map loads but no vehicles, or an error page.** Either `GOOGLE_MAPS_KEY` is unset
  (the Maps script is never injected) or the upstream `api.lad.lviv.ua` is down (the
  home route then returns `502`; the route list is served stale from cache when one
  is available).
- **Checking a route does nothing.** The subscribe is acked with `{ ok: false }` for
  an unknown route code, or when you exceed the per-socket rate limit
  (30 subscribes / 10s). Check the browser console.
- **Updates stop after a reconnect.** The client auto-resubscribes on reconnect; if
  it stays stuck, the browser origin is likely not in `ALLOWED_ORIGINS` (see
  [Deployment](#deployment)).

## Project structure

```text
app.js          - Express app entry (helmet, compression, routes, error handling)
bin/www         - HTTP server bootstrap + graceful shutdown
config/         - Environment/config loader (dotenv)
routes/         - Express route handlers (/, /json, /healthz, /about, /contact)
models/         - Upstream API client (fetch wrapper with timeout)
services/       - Shared route-list TTL cache + valid-code lookup
socket/         - Socket.IO event handlers, poll loop, rooms, event-name enum
src/            - Frontend ES modules (bundled by Vite into public/dist)
utils/          - Upstream API URL builders
views/          - EJS templates
public/         - Static assets (CSS, favicons); public/dist holds the built bundle
test/           - Node built-in test runner specs
e2e/            - Playwright browser smoke tests
```

## Roadmap and known limitations

- `google.maps.Marker` was deprecated by Google in February 2024 in favor of
  `AdvancedMarkerElement`; the app still uses the classic marker. Migration is a
  known follow-up.
- A Maps-tuned Content-Security-Policy is not yet enabled (see
  [Troubleshooting](#troubleshooting)).
- Render's free tier sleeps on inactivity, so the live demo has a cold start.
- Single upstream data source; if `api.lad.lviv.ua` is down there is no live data,
  though the cached route list is served stale where possible.

## Background

Built in 2017 against the SimpleRIDE API provided by the Lviv transit authority.
That API went offline in July 2018 and stayed down for years. In 2026 the project
was modernized (Node.js 20+, Express 5, Socket.IO 4, Vite) and migrated to
[api.lad.lviv.ua](https://github.com/vbhjckfd/timetable-api-node), an open, live JSON
REST API for Lviv public transit. Live bus data works again.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the local checks to run, and the
branch/PR workflow. In short:

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Make your changes and add tests where relevant
3. Run `npm test` and `npm run build`
4. Push the branch and open a pull request

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md)
rather than opening a public issue. Note that the Google Maps key is necessarily
exposed to the browser and is protected by referrer/API restrictions, not secrecy.

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

[Ivan Mykhavko](https://github.com/tegos)
