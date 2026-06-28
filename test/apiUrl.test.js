const { test } = require('node:test');
const assert = require('node:assert/strict');

const apiUrl = require('../utils/apiUrl');

test('getBusUrl returns lad.lviv.ua routes.json endpoint', () => {
    const url = apiUrl.getBusUrl();
    assert.ok(url.includes('api.lad.lviv.ua'), `got: ${url}`);
    assert.ok(url.endsWith('/routes.json'), `got: ${url}`);
});

test('getBusUrl returns a string', () => {
    const url = apiUrl.getBusUrl();
    assert.equal(typeof url, 'string');
});

test('getRouteUrl builds dynamic route URL with name', () => {
    const url = apiUrl.getRouteUrl('27T');
    assert.ok(url.includes('api.lad.lviv.ua'), `got: ${url}`);
    assert.ok(url.includes('/routes/dynamic/27T'), `got: ${url}`);
});

test('getRouteUrl URL-encodes non-ASCII route names', () => {
    const url = apiUrl.getRouteUrl('А01');
    assert.ok(url.includes('/routes/dynamic/'), `got: ${url}`);
    assert.ok(!url.includes(' '), `URL must not contain spaces: ${url}`);
});

test('getPathUrl builds static route URL with name', () => {
    const url = apiUrl.getPathUrl('5');
    assert.ok(url.includes('api.lad.lviv.ua'), `got: ${url}`);
    assert.ok(url.includes('/routes/static/5'), `got: ${url}`);
});

test('getPathUrl URL-encodes non-ASCII route names', () => {
    const url = apiUrl.getPathUrl('А01');
    assert.ok(url.includes('/routes/static/'), `got: ${url}`);
    assert.ok(!url.includes(' '), `URL must not contain spaces: ${url}`);
});
