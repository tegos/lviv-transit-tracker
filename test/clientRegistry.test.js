const { test } = require('node:test');
const assert = require('node:assert/strict');

const createRegistry = require('../socket/clientRegistry');

test('add tracks a route for a client and activeRoutes reflects it', () => {
    const reg = createRegistry();
    reg.add('sock1', '27');
    assert.deepEqual([...reg.activeRoutes()], ['27']);
});

test('activeRoutes dedups the same route across clients', () => {
    const reg = createRegistry();
    reg.add('sock1', '27');
    reg.add('sock2', '27');
    reg.add('sock1', '27');
    assert.deepEqual([...reg.activeRoutes()], ['27']);
});

test('remove drops a route for one client only; route stays active for others', () => {
    const reg = createRegistry();
    reg.add('sock1', '27');
    reg.add('sock2', '27');
    reg.remove('sock1', '27');
    assert.deepEqual([...reg.activeRoutes()], ['27']);
    reg.remove('sock2', '27');
    assert.deepEqual([...reg.activeRoutes()], []);
});

test('disconnect clears all routes for a client (no zombie routes)', () => {
    const reg = createRegistry();
    reg.add('sock1', '27');
    reg.add('sock1', '3a');
    reg.disconnect('sock1');
    assert.deepEqual([...reg.activeRoutes()], []);
});

test('subscribersOf lists socket ids subscribed to a route', () => {
    const reg = createRegistry();
    reg.add('sock1', '27');
    reg.add('sock2', '27');
    reg.add('sock2', '3a');
    assert.deepEqual([...reg.subscribersOf('27')].sort(), ['sock1', 'sock2']);
    assert.deepEqual([...reg.subscribersOf('3a')], ['sock2']);
});
