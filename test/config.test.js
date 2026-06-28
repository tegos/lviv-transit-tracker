const { test } = require('node:test');
const assert = require('node:assert/strict');

test('pollIntervalMs is a finite number', () => {
    const config = require('../config/index');
    assert.equal(typeof config.pollIntervalMs, 'number');
    assert.ok(Number.isFinite(config.pollIntervalMs), `expected finite number, got: ${config.pollIntervalMs}`);
});

test('pollIntervalMs defaults to 5000 when POLL_INTERVAL_MS env var is absent', () => {
    const saved = process.env.POLL_INTERVAL_MS;
    delete process.env.POLL_INTERVAL_MS;

    const configPath = require.resolve('../config/index');
    delete require.cache[configPath];
    const freshConfig = require('../config/index');

    assert.equal(freshConfig.pollIntervalMs, 5000);

    // restore env and evict the fresh module so later tests see original state
    if (saved !== undefined) process.env.POLL_INTERVAL_MS = saved;
    delete require.cache[configPath];
});
