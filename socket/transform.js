'use strict';

const MAX_ROUTE_ID_LENGTH = 20;

// api.lad.lviv.ua vehicle -> the shape the frontend map expects.
// Guards against a malformed upstream payload (non-array, or vehicles with no
// location): a bad response degrades to an empty update instead of throwing a
// TypeError that the poll loop would swallow, silently killing the route.
function toVehicles(raw, routeCode) {
    const list = Array.isArray(raw) ? raw : [];
    return list
        .filter((v) => v && Array.isArray(v.location) && v.location.length >= 2)
        .map((v) => ({
            id: v.id,
            lat: v.location[0],
            lng: v.location[1],
            bearing: v.bearing,
            routeCode,
            name: v.id,
        }));
}

// static route shapes -> polyline points for the map.
function toPath(shapes) {
    const firstShape = (shapes && shapes[0]) || [];
    return firstShape.map(([lat, lng]) => ({ lat, lng }));
}

function isValidRouteId(routeId) {
    return typeof routeId === 'string'
        && routeId.length > 0
        && routeId.length <= MAX_ROUTE_ID_LENGTH;
}

module.exports = { toVehicles, toPath, isValidRouteId };
