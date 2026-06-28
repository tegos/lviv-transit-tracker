# Lviv Transit Tracker

[![CI](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml)

Real-time public transit tracker for Lviv, Ukraine. Select bus routes on a Google Map and watch vehicle positions update live every 5 seconds.

![preview](docs/preview.gif)

## History

Built in 2017 against the SimpleRIDE API provided by the Lviv transit authority. That API went offline in July 2018 and stayed dead for years. In 2026 the project was modernized (Node 24, Express 5, Socket.IO 4) and migrated to [api.lad.lviv.ua](https://github.com/vbhjckfd/timetable-api-node) - an open, live JSON REST API for Lviv public transit. Live bus data works again.

## How it works

The server fetches available bus routes from `api.lad.lviv.ua` on page load. When a user checks a route in the sidebar, the browser emits a Socket.IO event; the server draws the route path on the map and begins polling live vehicle positions every 5 seconds, pushing updates back to all subscribed clients. Markers animate smoothly as positions change. On mobile, the route sidebar supports swipe gestures via HammerJS.

```
Browser ──(checkbox toggle)──> socket.emit('add-bus', routeCode)
Server ──> GET /routes/static/:name ──> socket.emit('drawRoute', path)
Server setInterval(5s) ──> GET /routes/dynamic/:name ──> socket.emit('defaultUpdate', vehicles, code)
Browser ──> animate markers on Google Map
```

## Tech stack

- Node.js 20+, Express 5
- Socket.IO 4 (server + client)
- EJS 6 templates
- dotenv (environment config)
- Google Maps JavaScript API
- HammerJS 2 (mobile swipe gestures)
- Bootstrap 3

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
| `DEFAULT_UPDATE` | `5000` | Polling interval in milliseconds |
| `GOOGLE_MAPS_KEY` | - | Google Maps JavaScript API key |

## Start

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). Check any route in the sidebar to track it on the map.

## Project structure

```
app.js          - Express app entry
bin/www         - HTTP server
routes/         - Express route handlers
models/         - API client (fetch wrapper)
socket/         - Socket.IO event handlers and polling loop
views/          - EJS templates
public/         - Static assets (JS, CSS)
utils/          - URL builders
test/           - Node built-in test runner specs
```

## Running tests

```bash
npm test
```

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Make your changes and add tests where relevant
3. Push the branch and open a pull request

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

[Ivan Mykhavko](https://github.com/Tegos)
