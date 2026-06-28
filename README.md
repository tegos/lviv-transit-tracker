# Lviv Transit Tracker

[![CI](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml)

Real-time public transit tracker for Lviv, Ukraine. Select bus routes on a Google Map and watch vehicle positions update live every 5 seconds.

![preview](docs/preview.gif)

## History

Built in 2017 against the SimpleRIDE API provided by the Lviv transit authority. That API went offline in July 2018 and stayed dead for years. In 2026 the project was modernized (Node 24, Express 5, Socket.IO 4) and migrated to [api.lad.lviv.ua](https://github.com/vbhjckfd/timetable-api-node) - an open, live JSON REST API for Lviv public transit. Live bus data works again.

## How it works

The server fetches available bus routes from `api.lad.lviv.ua` on page load. When a user checks a route in the sidebar, the browser emits a Socket.IO event; the server draws the route path on the map and begins polling live vehicle positions every 5 seconds, pushing updates back to all subscribed clients. Markers animate smoothly as positions change. On mobile, the route sidebar supports horizontal swipe gestures (native touch events).

```
Browser ──(checkbox toggle)──> socket.emit('route:subscribe', routeCode)
Server ──> GET /routes/static/:name ──> socket.emit('route:path', { routeCode, path })
Server setInterval(5s) ──> GET /routes/dynamic/:name ──> socket.emit('vehicles:update', vehicles, routeCode)
Browser ──> animate markers on Google Map
```

## Tech stack

- Node.js 20+, Express 5
- Socket.IO 4 (server + client)
- EJS 6 templates
- dotenv (environment config)
- Vite (frontend bundling; vanilla ES modules, no jQuery)
- Google Maps JavaScript API
- Bootstrap 3 (CSS only)

## Setup

```bash
git clone https://github.com/tegos/lviv-transit-tracker.git
cd lviv-transit-tracker
npm install
cp .env.example .env
```

Edit `.env` and set your Google Maps key:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `POLL_INTERVAL_MS` | `5000` | Vehicle-position polling interval in milliseconds |
| `GOOGLE_MAPS_KEY` | - | Google Maps JavaScript API key |

## Start

```bash
npm start
```

`npm start` runs the Vite build first (`prestart`), then boots the server. Open [http://localhost:3000](http://localhost:3000). Check any route in the sidebar to track it on the map.

## Project structure

```
app.js          - Express app entry
bin/www         - HTTP server
routes/         - Express route handlers
models/         - API client (fetch wrapper)
socket/         - Socket.IO event handlers, polling loop, event-name enum
src/            - Frontend ES modules (bundled by Vite into public/dist)
views/          - EJS templates
public/         - Static assets (CSS); public/dist holds the built bundle
utils/          - URL builders, route-list cache
test/           - Node built-in test runner specs
e2e/            - Playwright browser smoke tests
```

## Running tests

```bash
npm test              # unit + socket integration (offline)
INTEGRATION=1 npm test # also hit the live api.lad.lviv.ua
npm run test:e2e      # Playwright browser smoke tests
```

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Make your changes and add tests where relevant
3. Push the branch and open a pull request

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

[Ivan Mykhavko](https://github.com/Tegos)
