const { test } = require('node:test');
const assert = require('node:assert/strict');

const createCache = require('../utils/routeCache');

test('first call invokes fetchFn and returns its value', async () => {
    let calls = 0;
    const cache = createCache({ ttl: 1000, now: () => 0 });
    const val = await cache.get(async () => { calls++; return 'data'; });
    assert.equal(val, 'data');
    assert.equal(calls, 1);
});

test('second call within ttl returns cached value without refetching', async () => {
    let calls = 0;
    let clock = 0;
    const cache = createCache({ ttl: 1000, now: () => clock });
    await cache.get(async () => { calls++; return 'a'; });
    clock = 999;
    const val = await cache.get(async () => { calls++; return 'b'; });
    assert.equal(val, 'a');
    assert.equal(calls, 1);
});

test('call after ttl expiry refetches', async () => {
    let calls = 0;
    let clock = 0;
    const cache = createCache({ ttl: 1000, now: () => clock });
    await cache.get(async () => { calls++; return 'a'; });
    clock = 1001;
    const val = await cache.get(async () => { calls++; return 'b'; });
    assert.equal(val, 'b');
    assert.equal(calls, 2);
});

test('concurrent calls share a single in-flight fetch', async () => {
    let calls = 0;
    const cache = createCache({ ttl: 1000, now: () => 0 });
    const fetchFn = async () => { calls++; return 'data'; };
    const [a, b] = await Promise.all([cache.get(fetchFn), cache.get(fetchFn)]);
    assert.equal(a, 'data');
    assert.equal(b, 'data');
    assert.equal(calls, 1);
});

test('a rejected fetch is not cached; next call retries', async () => {
    let calls = 0;
    const cache = createCache({ ttl: 1000, now: () => 0 });
    await assert.rejects(() => cache.get(async () => { calls++; throw new Error('boom'); }));
    const val = await cache.get(async () => { calls++; return 'ok'; });
    assert.equal(val, 'ok');
    assert.equal(calls, 2);
});
