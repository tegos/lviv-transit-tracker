const { test } = require('node:test');
const assert = require('node:assert/strict');

const apiUrl = require('../utils/apiUrl');

test('getBusUrl returns CompositeRoute endpoint', () => {
    const url = apiUrl.getBusUrl();
    assert.ok(url.endsWith('CompositeRoute/'), `got: ${url}`);
});

test('getRouteUrl includes route code in query string', () => {
    const url = apiUrl.getRouteUrl('27');
    assert.ok(url.includes('code=27'), `got: ${url}`);
});

test('getPathUrl includes route code in query string', () => {
    const url = apiUrl.getPathUrl('5');
    assert.ok(url.includes('code=5'), `got: ${url}`);
});
