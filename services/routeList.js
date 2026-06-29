'use strict';

const model = require('../models/model');
const createCache = require('./routeCache');

// Single shared TTL cache for the route list, used by both the HTTP routes
// (home page / JSON) and the socket layer (valid-route-code validation), so a
// cold cache under load only hits the upstream API once.
const cache = createCache();

function getRoutes() {
    return cache.get(() => model.getBuses());
}

// Set of valid route codes (short_name), used to reject subscriptions to
// arbitrary codes before any upstream fetch is issued.
async function getValidCodes() {
    const routes = await getRoutes();
    return new Set(routes.map((r) => String(r.short_name)));
}

module.exports = { getRoutes, getValidCodes };
