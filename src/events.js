// Map update handlers. mapUtil is passed in rather than read from a global.

export function handleVehiclesUpdate(mapUtil, vehicles, routeCode) {
    vehicles.forEach((vehicle) => {
        const position = new google.maps.LatLng(vehicle.lat, vehicle.lng);

        if (mapUtil.isMarkerOnMap(vehicle.id)) {
            mapUtil.moveMarker(mapUtil.getMarkerById(vehicle.id), position);
        } else {
            const content = `Маршрут: <b>${vehicle.routeCode}</b><br/>ТЗ: <b>${vehicle.name}</b>`;
            const infowindow = new google.maps.InfoWindow({ content, maxWidth: 500 });
            mapUtil.addMarker(position, vehicle.id, infowindow, vehicle.bearing, routeCode);
        }
    });

    // Drop markers for vehicles that fell out of this update (ended shift /
    // stopped reporting) so they don't linger frozen and accumulate.
    mapUtil.reconcileRoute(routeCode, new Set(vehicles.map((v) => v.id)));
}

export function handleRoutePath(mapUtil, { routeCode, path }) {
    const coordinates = path.map((point) => new google.maps.LatLng(point.lat, point.lng));
    mapUtil.drawPath(coordinates, routeCode);
    mapUtil.fitToPath(coordinates);
}

export function clearRoute(mapUtil, routeCode) {
    mapUtil.removePath(routeCode);
    mapUtil.deleteMarkersByCode(routeCode);
}
