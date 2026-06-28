const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const router = require('./routes');
const Model = require('./models/model');

const app = express();

app.io = require('socket.io')();

const config = require('./config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// node_modules
app.use('/scripts', express.static(path.join(__dirname, 'node_modules')));

//define routes

app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

const socketDataClients = [];
let allBuses = [];
let allClients = [];

//start listen with socket.io
app.io.on('connection', function (socket) {
	socketDataClients[socket.id] = [];

	// add bus
	socket.on('add-bus', function (route_id) {
		console.log('add-bus');
		allBuses.push(route_id);
		allBuses = [...new Set(allBuses)];

		socketDataClients[socket.id].push(route_id);
		socketDataClients[socket.id] = [...new Set(socketDataClients[socket.id])];

		const routePathPromise = Model.getPathData(route_id);

		routePathPromise.then(function (response) {

				const content = response.getBody();
				const routePathData = JSON.parse(content);
				const data = {path: routePathData, code: route_id};
				app.io.sockets.sockets.get(socket.id).emit('drawRoute', data);
			}
		);
	});

	// remove bus
	socket.on('remove-bus', function (bus_id) {
		console.log('remove-bus');

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
var intervalDefaultUpdate = setInterval(function () {
	console.log('defaultUpdate');

	allBuses.forEach(function (route_code) {
		const routeDataProm = Model.getRoutes(route_code);

		routeDataProm.then(function (response) {
				const content = response.getBody();
				var routeData = JSON.parse(content);

				for (var socket_id in socketDataClients) {
					const array_buses = socketDataClients[socket_id];

					if (array_buses.indexOf(route_code) > -1) {
						app.io.sockets.sockets.get(socket_id).emit('defaultUpdate', routeData, route_code);
					}
				}
			}
		);
	});

	//console.log(socketDataClients);


}, config.defaultUpdate).unref();


module.exports = app;
