const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const Model = require('../models/model');
const setupSocket = require('../socket');

// These tests exercise the real Socket.IO event wiring in socket/index.js
// (add-bus / remove-bus / disconnect / ack) with Model stubbed so no network
// is hit. The pure tracking + transform logic is covered separately in
// clientRegistry.test.js and transform.test.js.

let httpServer;
let io;
let interval;
let port;

const origGetPathData = Model.getPathData;
const origGetRoutes = Model.getRoutes;

before(async () => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    interval = setupSocket(io);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
});

after(() => {
    clearInterval(interval);
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

test('add-bus fetches the path, emits drawRoute, and acks ok', async () => {
    Model.getPathData = async () => ({
        getBody: () => JSON.stringify({ shapes: [[[49.84, 24.03], [49.85, 24.04]]] }),
    });

    const client = connect();
    try {
        const drawRoute = new Promise((resolve) => client.on('drawRoute', resolve));
        const ack = await client.emitWithAck('add-bus', '27');
        const drawn = await drawRoute;

        assert.deepEqual(ack, { ok: true });
        assert.equal(drawn.code, '27');
        assert.deepEqual(drawn.path, [{ Y: 49.84, X: 24.03 }, { Y: 49.85, X: 24.04 }]);
    } finally {
        client.disconnect();
    }
});

test('add-bus with an invalid route id acks an error and never draws', async () => {
    let pathCalled = false;
    Model.getPathData = async () => { pathCalled = true; return { getBody: () => '{}' }; };

    const client = connect();
    try {
        let drew = false;
        client.on('drawRoute', () => { drew = true; });
        const ack = await client.emitWithAck('add-bus', 'x'.repeat(50));

        assert.equal(ack.ok, false);
        assert.equal(pathCalled, false);
        assert.equal(drew, false);
    } finally {
        client.disconnect();
    }
});

test('add-bus acks an error when the path fetch fails', async () => {
    Model.getPathData = async () => { throw new Error('upstream down'); };

    const client = connect();
    try {
        const ack = await client.emitWithAck('add-bus', '27');
        assert.equal(ack.ok, false);
        assert.match(ack.error, /upstream down/);
    } finally {
        client.disconnect();
    }
});
