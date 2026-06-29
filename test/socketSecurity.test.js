const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const Model = require('../models/model');
const setupSocket = require('../socket');
const Events = require('../socket/events');

// Exercises the subscribe-time guards added in the security pass: route-code
// validation against the known list, the per-socket subscription cap, and the
// per-socket subscribe rate limit. Model is stubbed so no network is hit.

let httpServer;
let io;
let socketCtl;
let port;

const origGetPathData = Model.getPathData;

before(async () => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    socketCtl = setupSocket(io, {
        pollIntervalMs: 60000,
        isKnownRoute: async (code) => code === 'known',
        maxRoutesPerSocket: 2,
        subscribeRateLimit: { points: 3, windowMs: 60000 },
    });
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
});

after(() => {
    socketCtl.stop();
    io.close();
    httpServer.close();
});

beforeEach(() => {
    Model.getPathData = async () => ({ shapes: [] });
});

function connect() {
    return ioClient(`http://localhost:${port}`, { forceNew: true, transports: ['websocket'] });
}

test('rejects a well-formed but unknown route code before any upstream fetch', async () => {
    let pathCalled = false;
    Model.getPathData = async () => { pathCalled = true; return { shapes: [] }; };

    const client = connect();
    try {
        const ack = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'unknown');
        assert.equal(ack.ok, false);
        assert.match(ack.error, /unknown route code/);
        assert.equal(pathCalled, false);
    } finally {
        client.disconnect();
    }
});

test('accepts a known route code', async () => {
    const client = connect();
    try {
        const ack = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'known');
        assert.deepEqual(ack, { ok: true });
    } finally {
        client.disconnect();
    }
});

test('enforces the per-socket subscription cap', async () => {
    // isKnownRoute only allows 'known', so use a validator-bypassing server is
    // not needed: cap is checked before isKnownRoute. Spin a dedicated server
    // that treats every code as known to isolate the cap behaviour.
    const srv = http.createServer();
    const sio = new Server(srv);
    const ctl = setupSocket(sio, {
        pollIntervalMs: 60000,
        isKnownRoute: async () => true,
        maxRoutesPerSocket: 2,
        subscribeRateLimit: null,
    });
    await new Promise((r) => srv.listen(0, r));
    const p = srv.address().port;
    const client = ioClient(`http://localhost:${p}`, { forceNew: true, transports: ['websocket'] });
    try {
        assert.equal((await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'a')).ok, true);
        assert.equal((await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'b')).ok, true);
        const third = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'c');
        assert.equal(third.ok, false);
        assert.match(third.error, /subscription limit/);
    } finally {
        client.disconnect();
        ctl.stop();
        sio.close();
        srv.close();
    }
});

test('rate-limits subscribe spam from a single socket', async () => {
    const srv = http.createServer();
    const sio = new Server(srv);
    const ctl = setupSocket(sio, {
        pollIntervalMs: 60000,
        isKnownRoute: async () => true,
        maxRoutesPerSocket: 100,
        subscribeRateLimit: { points: 2, windowMs: 60000 },
    });
    await new Promise((r) => srv.listen(0, r));
    const p = srv.address().port;
    const client = ioClient(`http://localhost:${p}`, { forceNew: true, transports: ['websocket'] });
    try {
        assert.equal((await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'r1')).ok, true);
        assert.equal((await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'r2')).ok, true);
        const third = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'r3');
        assert.equal(third.ok, false);
        assert.match(third.error, /rate limited/);
    } finally {
        client.disconnect();
        ctl.stop();
        sio.close();
        srv.close();
    }
});
