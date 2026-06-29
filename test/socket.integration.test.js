const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const Model = require('../models/model');
const setupSocket = require('../socket');
const Events = require('../socket/events');

// These tests exercise the real Socket.IO event wiring in socket/index.js
// (route:subscribe / route:unsubscribe / disconnect / ack) with Model stubbed so no network
// is hit. The pure tracking + transform logic is covered separately in
// clientRegistry.test.js and transform.test.js.

let httpServer;
let io;
let socketCtl;
let port;

const origGetPathData = Model.getPathData;
const origGetRoutes = Model.getRoutes;

before(async () => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    // Long interval so the auto-loop never fires during tests; cycles are
    // driven deterministically via socketCtl.pollOnce(). isKnownRoute is stubbed
    // so route validation doesn't reach the network (covered in socketSecurity).
    socketCtl = setupSocket(io, { pollIntervalMs: 60000, isKnownRoute: async () => true });
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
});

after(() => {
    socketCtl.stop();
    io.close();
    httpServer.close();
});

beforeEach(() => {
    Model.getPathData = origGetPathData;
    Model.getRoutes = origGetRoutes;
});

function connect() {
    return ioClient(`http://localhost:${port}`, { forceNew: true, transports: ['websocket'] });
}

test('route:subscribe fetches the path, emits route:path, and acks ok', async () => {
    Model.getPathData = async () => ({ shapes: [[[49.84, 24.03], [49.85, 24.04]]] });

    const client = connect();
    try {
        const routePath = new Promise((resolve) => client.on(Events.ROUTE_PATH, resolve));
        const ack = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, '27');
        const drawn = await routePath;

        assert.deepEqual(ack, { ok: true });
        assert.equal(drawn.routeCode, '27');
        assert.deepEqual(drawn.path, [{ lat: 49.84, lng: 24.03 }, { lat: 49.85, lng: 24.04 }]);
    } finally {
        client.disconnect();
    }
});

test('route:subscribe with an invalid route code acks an error and never emits a path', async () => {
    let pathCalled = false;
    Model.getPathData = async () => { pathCalled = true; return {}; };

    const client = connect();
    try {
        let emittedPath = false;
        client.on(Events.ROUTE_PATH, () => { emittedPath = true; });
        const ack = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, 'x'.repeat(50));

        assert.equal(ack.ok, false);
        assert.equal(pathCalled, false);
        assert.equal(emittedPath, false);
    } finally {
        client.disconnect();
    }
});

test('route:subscribe acks an error when the path fetch fails', async () => {
    Model.getPathData = async () => { throw new Error('upstream down'); };

    const client = connect();
    try {
        const ack = await client.emitWithAck(Events.ROUTE_SUBSCRIBE, '27');
        assert.equal(ack.ok, false);
        assert.match(ack.error, /upstream down/);
    } finally {
        client.disconnect();
    }
});

test('poll cycle fetches active routes and pushes vehicles:update to subscribers', async () => {
    Model.getPathData = async () => ({ shapes: [[[49.84, 24.03]]] });
    Model.getRoutes = async () => [{ id: 'bus1', location: [49.84, 24.03], bearing: 90 }];

    const client = connect();
    try {
        await client.emitWithAck(Events.ROUTE_SUBSCRIBE, '27');

        const update = new Promise((resolve) =>
            client.on(Events.VEHICLES_UPDATE, (vehicles, routeCode) => resolve({ vehicles, routeCode })));

        await socketCtl.pollOnce();

        const { vehicles, routeCode } = await update;
        assert.equal(routeCode, '27');
        assert.deepEqual(vehicles, [
            { id: 'bus1', lat: 49.84, lng: 24.03, bearing: 90, routeCode: '27', name: 'bus1' },
        ]);
    } finally {
        client.disconnect();
    }
});

test('a route whose fetch throws does not abort the cycle for other routes', async () => {
    Model.getPathData = async () => ({ shapes: [[[49.84, 24.03]]] });
    Model.getRoutes = async (code) => {
        if (code === 'bad') throw new Error('upstream 500');
        return [{ id: 'busA', location: [49.84, 24.03], bearing: 0 }];
    };

    const good = connect();
    const bad = connect();
    try {
        await bad.emitWithAck(Events.ROUTE_SUBSCRIBE, 'bad');
        await good.emitWithAck(Events.ROUTE_SUBSCRIBE, '5');

        const update = new Promise((resolve) =>
            good.on(Events.VEHICLES_UPDATE, (vehicles, routeCode) => resolve({ vehicles, routeCode })));

        await socketCtl.pollOnce();

        const { routeCode, vehicles } = await update;
        assert.equal(routeCode, '5');
        assert.equal(vehicles[0].id, 'busA');
    } finally {
        good.disconnect();
        bad.disconnect();
    }
});
