'use strict';

const Model = require('../models/model');
const config = require('../config');
const createRegistry = require('./clientRegistry');
const { toVehicles, toPath, isValidRouteId } = require('./transform');
const Events = require('./events');

function setupSocket(io) {
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
				const response = await Model.getPathData(routeCode);
				const routePathData = JSON.parse(response.getBody());
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

	// poll active routes and push vehicle updates to their subscribers
	const pollInterval = setInterval(async function () {
		const routeCodes = registry.activeRoutes();
		if (routeCodes.size === 0) return;

		for (const routeCode of routeCodes) {
			try {
				const response = await Model.getRoutes(routeCode);
				const rawData = JSON.parse(response.getBody());
				const vehicles = toVehicles(rawData, routeCode);

				for (const socketId of registry.subscribersOf(routeCode)) {
					io.sockets.sockets.get(socketId)?.emit(Events.VEHICLES_UPDATE, vehicles, routeCode);
				}
			} catch (err) {
				console.error(`${Events.VEHICLES_UPDATE} error for route`, routeCode, ':', err);
			}
		}
	}, config.pollIntervalMs).unref();

	return pollInterval;
}

module.exports = setupSocket;
