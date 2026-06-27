const { test } = require('node:test');
const assert = require('node:assert/strict');

test('defaultUpdate is a finite number', () => {
    const config = require('../config/index');
    assert.equal(typeof config.defaultUpdate, 'number');
    assert.ok(Number.isFinite(config.defaultUpdate), `expected finite number, got: ${config.defaultUpdate}`);
});

test('defaultUpdate defaults to 5000 when DEFAULT_UPDATE env var is absent', () => {
    const saved = process.env.DEFAULT_UPDATE;
    delete process.env.DEFAULT_UPDATE;

    const configPath = require.resolve('../config/index');
    delete require.cache[configPath];
    const freshConfig = require('../config/index');

    assert.equal(freshConfig.defaultUpdate, 5000);

    // restore env and evict the fresh module so later tests see original state
    if (saved !== undefined) process.env.DEFAULT_UPDATE = saved;
    delete require.cache[configPath];
});

test('apiUrl is a string', () => {
    const config = require('../config/index');
    assert.equal(typeof config.apiUrl, 'string');
});
