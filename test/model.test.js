const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const model = require('../models/model');

let capturedUrl;

beforeEach(() => {
    capturedUrl = null;
    global.fetch = async (url) => {
        capturedUrl = url;
        return {
            ok: true,
            text: async () => '[{"id":1}]'
        };
    };
});

afterEach(() => {
    delete global.fetch;
});

test('getBuses calls the bus endpoint and exposes body via getBody()', async () => {
    const res = await model.getBuses();
    assert.ok(capturedUrl.includes('CompositeRoute'), `URL was: ${capturedUrl}`);
    assert.equal(res.getBody(), '[{"id":1}]');
});

test('getRoutes rejects with status code when server returns error', async () => {
    global.fetch = async () => ({ ok: false, status: 503, text: async () => 'unavailable' });
    await assert.rejects(
        () => model.getRoutes('27'),
        (err) => err.code === 503
    );
});

test('getPathData calls an endpoint that includes path/', async () => {
    const res = await model.getPathData('7');
    assert.ok(capturedUrl.includes('path/'), `URL was: ${capturedUrl}`);
    assert.equal(res.getBody(), '[{"id":1}]');
});

test('getRoutes resolves and getBody() returns the mocked text', async () => {
    const res = await model.getRoutes('15');
    assert.equal(res.getBody(), '[{"id":1}]');
});
