# Security Policy

## Supported versions

This is a small single-deployment project; only the latest `main` is supported.
Fixes are applied to `main` and redeployed.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, use GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, affected component, and steps to reproduce.

You can expect an initial response within a few days. Once a fix is released,
the report will be disclosed with credit to the reporter (unless you prefer
otherwise).

## Scope notes

- The Google Maps API key is necessarily exposed to the browser; it is protected
  by HTTP-referrer and API restrictions in Google Cloud, not by secrecy.
- The server proxies a public upstream API (`api.lad.lviv.ua`); reports about
  that upstream should go to its maintainers.
