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
            json: async () => [{ id: 1 }]
        };
    };
});

afterEach(() => {
    delete global.fetch;
});

test('getBuses calls the bus endpoint and returns parsed JSON', async () => {
    const routes = await model.getBuses();
    assert.ok(capturedUrl.includes('routes.json'), `URL was: ${capturedUrl}`);
    assert.deepEqual(routes, [{ id: 1 }]);
});

test('getRoutes rejects with status code when server returns error', async () => {
    global.fetch = async () => ({ ok: false, status: 503, text: async () => 'unavailable' });
    await assert.rejects(
        () => model.getRoutes('27'),
        (err) => err.code === 503
    );
});

test('getPathData calls the static route endpoint and returns parsed JSON', async () => {
    const data = await model.getPathData('7');
    assert.ok(capturedUrl.includes('/routes/static/'), `URL was: ${capturedUrl}`);
    assert.deepEqual(data, [{ id: 1 }]);
});

test('getRoutes returns parsed JSON', async () => {
    const data = await model.getRoutes('15');
    assert.deepEqual(data, [{ id: 1 }]);
});
