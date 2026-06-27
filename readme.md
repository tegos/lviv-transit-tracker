# Lviv Transit Tracker

[![CI](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/lviv-transit-tracker/actions/workflows/ci.yml)

Real-time public transit tracker for Lviv, Ukraine. Select bus routes on a Google Map and watch vehicle positions update live every 5 seconds.

Built in 2017 as a demo project using the SimpleRIDE API provided by the Lviv transit authority.

## How it works

The server fetches available bus routes from the SimpleRIDE API on startup. When a user checks a route in the sidebar, the browser emits a Socket.IO event, the server draws the route path on the map and begins polling live vehicle positions every 5 seconds, pushing updates back to all subscribed clients. Markers animate smoothly as positions change. On mobile, the route sidebar supports swipe gestures via HammerJS.

```
Browser ──(checkbox toggle)──> socket.emit('add-bus', routeCode)
Server ──> fetch SimpleRIDE API for route path ──> socket.emit('drawRoute', data)
Server setInterval(5s) ──> fetch live positions ──> socket.emit('defaultUpdate', data, code)
Browser ──> animate markers on Google Map
```

## Tech stack

- Node.js 24, Express 5
- Socket.IO 4 (server + client)
- EJS templates
- Google Maps JavaScript API
- HammerJS (mobile swipe gestures)
- Bootstrap 3
- nconf (config management)

## Requirements

- Node.js 20+
- A Google Maps API key with the Maps JavaScript API enabled
- Access to a SimpleRIDE API endpoint (Lviv transit authority)

## Setup

```bash
git clone https://github.com/tegos/lviv-transit-tracker.git
cd lviv-transit-tracker
npm install
```

Create `config/config.json` from the example:

```bash
cp config/config.example.json config/config.json
```

Edit `config/config.json` and fill in your values:

```json
{
  "port": 3000,
  "defaultUpdate": 5000,
  "api": {
    "url": "YOUR_SIMPLERIDE_API_URL"
  }
}
```

| Key | Description |
|-----|-------------|
| `port` | HTTP port the server listens on (default: `3000`) |
| `defaultUpdate` | Polling interval in milliseconds (default: `5000`) |
| `api.url` | Base URL of the SimpleRIDE Web API |

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
config/         - nconf setup and config.json (not committed)
utils/          - Shared utilities
test/           - Node built-in test runner specs
```

## Running tests

```bash
npm test
```

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

[Ivan Mykhavko](https://github.com/Tegos)
