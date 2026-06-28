const COLORS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#00bcd4', '#009688', '#ff5722', '#795548',
];

const MARKER_PATH = 'M39.652,16.446C39.652,7.363,32.289,0,23.206,0C14.124,0,6.761,7.363,6.761,16.446c0,1.775,0.285,3.484,0.806,5.086h0,c0,0,1.384,6.212,15.536,24.742c8.103-10.611,12.018-17.178,13.885-20.857C38.67,22.836,39.652,19.756,39.652,16.446z,M23.024,27.044c-5.752,0-10.416-4.663-10.416-10.416c0-5.752,4.664-10.415,10.416-10.415s10.416,4.663,10.416,10.415,C33.439,22.381,28.776,27.044,23.024,27.044z';

// Create a Google map on the given element. Replaces the old $.fn.googleMap
// jQuery plugin.
export function createMap(el, options) {
    const map = new google.maps.Map(el, { zoom: 5, ...options });

    window.addEventListener('resize', () => {
        const center = map.getCenter();
        map.setCenter(center);
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        });
    } else {
        console.warn('No geo location');
    }

    return map;
}

export class MapUtil {
    constructor(map) {
        this.map = map;
        this.markers = new Map(); // vehicleId -> marker
        this.paths = new Map();   // routeCode -> polyline
    }

    deleteMarkers() {
        for (const marker of this.markers.values()) marker.setMap(null);
        this.markers.clear();
    }

    addMarker(location, id, infoWindow, angle, routeCode) {
        const marker = new google.maps.Marker({ id, routeCode, position: location, map: this.map });

        marker.setIcon({
            path: MARKER_PATH,
            scale: 0.8,
            strokeColor: '#000000',
            fillOpacity: 1,
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(23, 16),
            rotation: -90 - angle,
        });

        marker.addListener('click', () => infoWindow.open(this.map, marker));
        this.markers.set(id, marker);
    }

    isMarkerOnMap(id) {
        return this.markers.has(id);
    }

    getMarkerById(id) {
        return this.markers.get(id) || null;
    }

    moveMarker(marker, newPosition) {
        const start = marker.getPosition();
        const e = 0.00001;
        if (Math.abs(start.lat() - newPosition.lat()) > e || Math.abs(start.lng() - newPosition.lng()) > e) {
            marker.animateTo(newPosition, { duration: 3000 });
        }
    }

    drawPath(pathCoord, code) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const mapPath = new google.maps.Polyline({
            zIndex: -100,
            optimized: false,
            path: pathCoord,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.75,
            strokeWeight: 5,
        });
        mapPath.setMap(this.map);
        this.paths.set(code, mapPath);
    }

    removePath(code) {
        const mapPath = this.paths.get(code);
        if (!mapPath) return;
        mapPath.setMap(null);
        this.paths.delete(code);
    }

    deleteMarkersByCode(code) {
        for (const [id, marker] of this.markers) {
            if (marker.routeCode === code) {
                marker.setMap(null);
                this.markers.delete(id);
            }
        }
    }
}
