const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const compression = require('compression');
const helmet = require('helmet');

const config = require('./config');
const router = require('./routes');
const setupSocket = require('./socket');

const app = express();

// Restrict which browser origins may open a Socket.IO connection, so other
// sites can't drive the server cross-origin. Defaults to the prod URL in
// production and localhost in dev; override with ALLOWED_ORIGINS.
const corsOrigins = config.allowedOrigins.length
	? config.allowedOrigins
	: (config.isProduction
		? ['https://lviv-transit-tracker.onrender.com']
		: ['http://localhost:3000', 'http://127.0.0.1:3000']);

app.io = require('socket.io')({ cors: { origin: corsOrigins, methods: ['GET', 'POST'] } });

app.socketCtl = setupSocket(app.io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Security headers. CSP is intentionally disabled: a policy strict enough to be
// useful must be tuned for the Google Maps JS API and verified in-browser with a
// Maps key, which the referrer-restricted key prevents locally (follow-up). The
// rest of helmet's defaults (frame protection, nosniff, referrer-policy, HSTS,
// no x-powered-by) ship now.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

//define routes
app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
