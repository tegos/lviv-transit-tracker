'use strict';

const Model = require('../models/model');
const config = require('../config');
const createRegistry = require('./clientRegistry');
const { toVehicles, toPath, isValidRouteId } = require('./transform');
const Events = require('./events');

function setupSocket(io, { pollIntervalMs = config.pollIntervalMs } = {}) {
	const registry = createRegistry();

	io.on('connection', function (socket) {
		// subscribe to a route: send its path once, then stream vehicle updates
		socket.on(Events.ROUTE_SUBSCRIBE, async function (routeCode, ack) {
			if (!isValidRouteId(routeCode)) {
				if (typeof ack === 'function') ack({ ok: false, error: 'invalid route code' });
				return;
			}
			registry.add(socket.id, routeCode);

			try {
				const routePathData = await Model.getPathData(routeCode);
				const path = toPath(routePathData.shapes);
				socket.emit(Events.ROUTE_PATH, { routeCode, path });
				if (typeof ack === 'function') ack({ ok: true });
			} catch (err) {
				console.error(`${Events.ROUTE_SUBSCRIBE} error:`, err);
				if (typeof ack === 'function') ack({ ok: false, error: err.message });
			}
		});

		// unsubscribe from a route
		socket.on(Events.ROUTE_UNSUBSCRIBE, function (routeCode) {
			registry.remove(socket.id, routeCode);
		});

		socket.on('disconnect', function () {
			registry.disconnect(socket.id);
		});
	});

	// One poll cycle: fetch every active route concurrently and push updates.
	// Per-route try/catch so a single failing route never rejects the batch.
	async function pollOnce() {
		const routeCodes = registry.activeRoutes();
		if (routeCodes.size === 0) return;

		await Promise.allSettled([...routeCodes].map(async (routeCode) => {
			try {
				const rawData = await Model.getRoutes(routeCode);
				const vehicles = toVehicles(rawData, routeCode);

				for (const socketId of registry.subscribersOf(routeCode)) {
					io.sockets.sockets.get(socketId)?.emit(Events.VEHICLES_UPDATE, vehicles, routeCode);
				}
			} catch (err) {
				console.error(`${Events.VEHICLES_UPDATE} error for route`, routeCode, ':', err);
			}
		}));
	}

	// Self-scheduling loop instead of setInterval: the next cycle is scheduled
	// only after the current one settles, so a slow upstream can never stack
	// overlapping cycles (which previously caused duplicate emits + request
	// amplification against an already-degraded API).
	let pollTimer = null;
	let stopped = false;

	function scheduleNext() {
		if (stopped) return;
		pollTimer = setTimeout(async () => {
			try {
				await pollOnce();
			} finally {
				scheduleNext();
			}
		}, pollIntervalMs);
		pollTimer.unref();
	}

	scheduleNext();

	return {
		// Stops the poll loop and clears any pending timer (used on shutdown).
		stop() {
			stopped = true;
			if (pollTimer) clearTimeout(pollTimer);
		},
		// Runs a single poll cycle on demand (used by tests to trigger a tick
		// deterministically without waiting for the interval).
		pollOnce,
	};
}

module.exports = setupSocket;
