var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var router = require('./routes');
var Model = require('./models/model');

var app = express();


//var middleware = require('./middleware')(app);

// call socket.io to the app
app.io = require('socket.io')();

var config = require('./config');

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

var socketDataClients = [];
var allBuses = [];
var allClients = [];

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

		var routePathPromise = Model.getPathData(route_id);

		routePathPromise.then(function (response) {

				var content = response.getBody();
				var routePathData = JSON.parse(content);
				var data = {path: routePathData, code: route_id};
				app.io.sockets.sockets.get(socket.id).emit('drawRoute', data);
			}
		);
	});

	// remove bus
	socket.on('remove-bus', function (bus_id) {
		console.log('remove-bus');

		var socket_buses = socketDataClients[socket.id];
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
//var intervalDefaultUpdate = setTimeout(function () {
	console.log('defaultUpdate');
	//console.log(allBuses);

	allBuses.forEach(function (route_code) {
		var routeDataProm = Model.getRoutes(route_code);

		routeDataProm.then(function (response) {
				var content = response.getBody();
				var routeData = JSON.parse(content);

				for (var socket_id in socketDataClients) {
					var array_buses = socketDataClients[socket_id];

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
