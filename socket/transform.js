'use strict';

const MAX_ROUTE_ID_LENGTH = 20;

// api.lad.lviv.ua vehicle -> the shape the frontend map expects.
function toVehicles(raw, routeCode) {
    return raw.map((v) => ({
        VehicleId: v.id,
        X: v.location[1],
        Y: v.location[0],
        Angle: v.bearing,
        RouteName: routeCode,
        VehicleName: v.id,
    }));
}

// static route shapes -> polyline points for the map.
function toPath(shapes) {
    const firstShape = (shapes && shapes[0]) || [];
    return firstShape.map(([lat, lng]) => ({ Y: lat, X: lng }));
}

function isValidRouteId(routeId) {
    return typeof routeId === 'string'
        && routeId.length > 0
        && routeId.length <= MAX_ROUTE_ID_LENGTH;
}

module.exports = { toVehicles, toPath, isValidRouteId };
