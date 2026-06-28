// Map update handlers. mapUtil is passed in rather than read from a global.

export function defaultUpdate(mapUtil, data, routeCode) {
    data.forEach((route) => {
        const position = new google.maps.LatLng(route.Y, route.X);

        if (mapUtil.isMarkerOnMap(route.VehicleId)) {
            mapUtil.moveMarker(mapUtil.getMarkerById(route.VehicleId), position);
        } else {
            const content = `Маршрут: <b>${route.RouteName}</b><br/>ТЗ: <b>${route.VehicleName}</b>`;
            const infowindow = new google.maps.InfoWindow({ content, maxWidth: 500 });
            mapUtil.addMarker(position, route.VehicleId, infowindow, route.Angle, routeCode);
        }
    });
}

export function drawRoute(mapUtil, data) {
    const coordinates = data.path.map((p) => new google.maps.LatLng(p.Y, p.X));
    mapUtil.drawPath(coordinates, data.code);
}

export function eventRemoveRoute(mapUtil, routeCode) {
    mapUtil.removePath(routeCode);
    mapUtil.deleteMarkersByCode(routeCode);
}
