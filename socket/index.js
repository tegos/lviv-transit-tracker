'use strict';

const Model = require('../models/model');
const config = require('../config');

function setupSocket(io) {
	const socketDataClients = [];
	let allBuses = [];

	io.on('connection', function (socket) {
		socketDataClients[socket.id] = [];

		// add bus
		socket.on('add-bus', function (route_id) {
			console.log('add-bus');
			allBuses.push(route_id);
			allBuses = [...new Set(allBuses)];

			socketDataClients[socket.id].push(route_id);
			socketDataClients[socket.id] = [...new Set(socketDataClients[socket.id])];

			Model.getPathData(route_id).then(function (response) {
				const content = response.getBody();
				const routePathData = JSON.parse(content);
				const data = {path: routePathData, code: route_id};
				const sock = io.sockets.sockets.get(socket.id);
				if (sock) sock.emit('drawRoute', data);
			}).catch(function (err) {
				console.error('add-bus error:', err);
			});
		});

		// remove bus
		socket.on('remove-bus', function (bus_id) {
			let socket_buses = socketDataClients[socket.id];
			socket_buses = socket_buses.filter(function (item) {
				return item !== bus_id;
			});

			socketDataClients[socket.id] = socket_buses;
		});

		// disconnect
		socket.on('disconnect', function () {
			delete socketDataClients[socket.id];
		});
	});

	// defaultUpdate every time
	const intervalDefaultUpdate = setInterval(function () {
		allBuses.forEach(function (route_code) {
			Model.getRoutes(route_code).then(function (response) {
				const content = response.getBody();
				const routeData = JSON.parse(content);

				for (const socket_id in socketDataClients) {
					const array_buses = socketDataClients[socket_id];

					if (array_buses.indexOf(route_code) > -1) {
						const sock = io.sockets.sockets.get(socket_id);
						if (sock) sock.emit('defaultUpdate', routeData, route_code);
					}
				}
			}).catch(function (err) {
				console.error('defaultUpdate error for route', route_code, ':', err);
			});
		});
	}, config.defaultUpdate).unref();

	return intervalDefaultUpdate;
}

module.exports = setupSocket;
