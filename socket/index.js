'use strict';

const Model = require('../models/model');
const config = require('../config');
const routeList = require('../services/routeList');
const createRegistry = require('./clientRegistry');
const { toVehicles, toPath, isValidRouteId } = require('./transform');
const Events = require('./events');

// A route code must be in the live route list, not merely a well-formed string.
// Rejects on failure (the home page hosting the socket has already warmed the
// shared route-list cache, so a transient upstream blip serves the stale set).
async function defaultIsKnownRoute(code) {
	try {
		return (await routeList.getValidCodes()).has(String(code));
	} catch {
		return false;
	}
}

// Per-socket sliding-window limiter to stop subscribe-event spam.
function createRateLimiter({ points, windowMs }) {
	const hits = new Map(); // socketId -> timestamps[]
	return {
		allow(socketId, now) {
			const recent = (hits.get(socketId) || []).filter((t) => now - t < windowMs);
			if (recent.length >= points) {
				hits.set(socketId, recent);
				return false;
			}
			recent.push(now);
			hits.set(socketId, recent);
			return true;
		},
		forget(socketId) {
			hits.delete(socketId);
		},
	};
}

function setupSocket(io, {
	pollIntervalMs = config.pollIntervalMs,
	isKnownRoute = defaultIsKnownRoute,
	maxRoutesPerSocket = 50,
	subscribeRateLimit = { points: 30, windowMs: 10000 },
} = {}) {
	const registry = createRegistry();
	const limiter = subscribeRateLimit ? createRateLimiter(subscribeRateLimit) : null;

	io.on('connection', function (socket) {
		// subscribe to a route: send its path once, then stream vehicle updates
		socket.on(Events.ROUTE_SUBSCRIBE, async function (routeCode, ack) {
			const reject = (error) => { if (typeof ack === 'function') ack({ ok: false, error }); };

			if (!isValidRouteId(routeCode)) return reject('invalid route code');
			if (limiter && !limiter.allow(socket.id, Date.now())) return reject('rate limited');
			if (registry.count(socket.id) >= maxRoutesPerSocket && !registry.has(socket.id, routeCode)) {
				return reject('subscription limit reached');
			}
			if (!(await isKnownRoute(routeCode))) return reject('unknown route code');

			try {
				const routePathData = await Model.getPathData(routeCode);
				const path = toPath(routePathData.shapes);
				// Register + join the room only after a successful path fetch, so a
				// failed subscribe never leaves an active subscription being polled.
				registry.add(socket.id, routeCode);
				socket.join(routeCode);
				socket.emit(Events.ROUTE_PATH, { routeCode, path });
				if (typeof ack === 'function') ack({ ok: true });
			} catch (err) {
				console.error(`${Events.ROUTE_SUBSCRIBE} error:`, err);
				reject(err.message);
			}
		});

		// unsubscribe from a route
		socket.on(Events.ROUTE_UNSUBSCRIBE, function (routeCode) {
			registry.remove(socket.id, routeCode);
			socket.leave(routeCode);
		});

		socket.on('disconnect', function () {
			registry.disconnect(socket.id);
			if (limiter) limiter.forget(socket.id);
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

				// Encoded once and fanned out by Socket.IO to everyone in the room.
				io.to(routeCode).emit(Events.VEHICLES_UPDATE, vehicles, routeCode);
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
