# Lviv Transit Tracker

[![CI](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml)

Real-time public transit tracker for Lviv, Ukraine. Select bus routes on a Google Map and watch vehicle positions update live every 5 seconds.

> **Note:** This is a demo project built in 2017. The SimpleRIDE API provided by the Lviv transit authority may no longer be publicly accessible. The code and architecture remain a working example of real-time Socket.IO polling, but live data cannot be guaranteed.

![preview](docs/preview.gif)

## How it works

The server fetches available bus routes from the SimpleRIDE API on startup. When a user checks a route in the sidebar, the browser emits a Socket.IO event, the server draws the route path on the map and begins polling live vehicle positions every 5 seconds, pushing updates back to all subscribed clients. Markers animate smoothly as positions change. On mobile, the route sidebar supports swipe gestures via HammerJS.

```
Browser ──(checkbox toggle)──> socket.emit('add-bus', routeCode)
Server ──> fetch SimpleRIDE API for route path ──> socket.emit('drawRoute', data)
Server setInterval(5s) ──> fetch live positions ──> socket.emit('defaultUpdate', data, code)
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

## Requirements

- Node.js 20+
- A Google Maps API key with the Maps JavaScript API enabled
- Access to a SimpleRIDE API endpoint (Lviv transit authority; may be unavailable - see note above)

## Setup

```bash
git clone https://github.com/tegos/lviv-transit-tracker.git
cd lviv-transit-tracker
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the server listens on |
| `API_URL` | - | Base URL of the SimpleRIDE Web API |
| `DEFAULT_UPDATE` | `5000` | Polling interval in milliseconds |

## Start

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in a browser. Check any route in the sidebar to start tracking it on the map.

## Project structure

```
app.js          - Express app, Socket.IO event handlers, polling interval
bin/www         - HTTP server entry point
routes/         - Express route definitions
models/         - SimpleRIDE API client
views/          - EJS templates
public/         - Static assets (JS, CSS)
utils/          - Shared utilities
test/           - Node built-in test runner specs
```

## Running tests

```bash
npm test
```

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b my-feature`)
2. Make your changes and add tests where relevant
3. Push the branch and open a pull request

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

[Ivan Mykhavko](https://github.com/Tegos)
