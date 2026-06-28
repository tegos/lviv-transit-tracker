'use strict';

const Model = require('../models/model');
const config = require('../config');
const createRegistry = require('./clientRegistry');
const { toVehicles, toPath, isValidRouteId } = require('./transform');

function setupSocket(io) {
	const registry = createRegistry();

	io.on('connection', function (socket) {
		// add bus
		socket.on('add-bus', async function (route_id, ack) {
			if (!isValidRouteId(route_id)) {
				if (typeof ack === 'function') ack({ ok: false, error: 'invalid route id' });
				return;
			}
			registry.add(socket.id, route_id);

			try {
				const response = await Model.getPathData(route_id);
				const routePathData = JSON.parse(response.getBody());
				const path = toPath(routePathData.shapes);
				socket.emit('drawRoute', { path, code: route_id });
				if (typeof ack === 'function') ack({ ok: true });
			} catch (err) {
				console.error('add-bus error:', err);
				if (typeof ack === 'function') ack({ ok: false, error: err.message });
			}
		});

		// remove bus
		socket.on('remove-bus', function (route_id) {
			registry.remove(socket.id, route_id);
		});

		// disconnect
		socket.on('disconnect', function () {
			registry.disconnect(socket.id);
		});
	});

	// poll active routes and push updates to their subscribers
	const intervalDefaultUpdate = setInterval(async function () {
		const routes = registry.activeRoutes();
		if (routes.size === 0) return;

		for (const route_code of routes) {
			try {
				const response = await Model.getRoutes(route_code);
				const rawData = JSON.parse(response.getBody());
				const routeData = toVehicles(rawData, route_code);

				for (const socket_id of registry.subscribersOf(route_code)) {
					io.sockets.sockets.get(socket_id)?.emit('defaultUpdate', routeData, route_code);
				}
			} catch (err) {
				console.error('defaultUpdate error for route', route_code, ':', err);
			}
		}
	}, config.defaultUpdate).unref();

	return intervalDefaultUpdate;
}

module.exports = setupSocket;
