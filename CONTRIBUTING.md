# Contributing

Thanks for your interest in improving the Lviv Transit Tracker.

## Getting started

```bash
git clone https://github.com/tegos/lviv-transit-tracker.git
cd lviv-transit-tracker
npm install
cp .env.example .env   # then set GOOGLE_MAPS_KEY
```

See the [README](README.md) for the full setup and environment-variable table.

## Development workflow

1. Fork the repo and create a feature branch with a descriptive name:
   `git checkout -b feat/my-feature` (or `fix/...`, `chore/...`, `docs/...`).
2. Make your change and add or update tests where it makes sense.
3. Run the checks below locally.
4. Push the branch and open a pull request against `main`.

## Running checks

```bash
npm test               # unit + socket integration (offline)
npm run test:coverage  # same, with coverage
INTEGRATION=1 npm test # also hits the live api.lad.lviv.ua
npm run build          # production Vite bundle (also runs in CI)
npm run test:e2e       # Playwright browser smoke tests
```

CI runs the build, the test suite on Node 20/22/24, and `npm audit`. Please make
sure `npm test` and `npm run build` pass before opening a PR.

## Code style

- Match the surrounding file's style (see `.editorconfig`).
- Keep changes focused; one logical change per PR is easiest to review.
- Frontend code lives in `src/` (vanilla ES modules, bundled by Vite). The
  server is plain Express + Socket.IO. No frameworks beyond what is already here.

## Reporting bugs and requesting features

Use the issue templates. For anything security-related, follow
[SECURITY.md](SECURITY.md) instead of opening a public issue.
