/**
 * Created by tegos on 14.03.2017.
 */

var map;
var mapUtil;
var mapCanvas;

var colors = ['#f44336',
    '#e91e63', '#9c27b0',
    '#673ab7', '#3f51b5',
    '#2196f3',
    '#00bcd4', '#009688',
    '#ff5722', '#795548'];

$.fn.googleMap = function (options) {
    var _this = this;

    var map;

    var settings = $.extend({}, {
        zoom: 5
    }, options);

    this.initialize = function () {

        map = new google.maps.Map(_this.get(0), settings);

        google.maps.event.addListener(map, "rightclick", function (event) {
            var lat = event.latLng.lat();
            var lng = event.latLng.lng();

            console.log("Lat=" + lat + "; Lng=" + lng);
        });


        //Resize Function
        google.maps.event.addDomListener(window, "resize", function () {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
        });

        // current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(initialLocation);
            });
        } else {
            console.warn('No geo location');
        }


        _this.data('map', map);

        return _this;
    };


    return this;
};

function MapUtil(map) {
    var _this = this;
    this.map = map;
    var markers = [];
    var paths = [];

    this.deleteMarkers = function () {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    };

    // Adds a marker to the map and push to the array.
    this.addMarker = function (location, id, infoWindow, angle, routeCode) {
        var marker = new google.maps.Marker({
            id: id,
            routeCode: routeCode,
            position: location,
            map: map
        });


        marker.setIcon({
            path: 'M39.652,16.446C39.652,7.363,32.289,0,23.206,0C14.124,0,6.761,7.363,6.761,16.446c0,1.775,0.285,3.484,0.806,5.086h0,c0,0,1.384,6.212,15.536,24.742c8.103-10.611,12.018-17.178,13.885-20.857C38.67,22.836,39.652,19.756,39.652,16.446z,M23.024,27.044c-5.752,0-10.416-4.663-10.416-10.416c0-5.752,4.664-10.415,10.416-10.415s10.416,4.663,10.416,10.415,C33.439,22.381,28.776,27.044,23.024,27.044z',
            scale: 0.8,
            strokeColor: "#000000",
            fillOpacity: 1,
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(23, 16),
            rotation: -90 - angle
        });


        google.maps.event.addListener(marker, 'click', function () {
            infoWindow.open(map, marker);
        });


        markers.push(marker);
        //console.log(markers);
    };

    this.getMarkers = function () {
        return markers;
    };

    this.isMarkerOnMap = function (id) {
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            var id_marker = marker.id;
            if (id_marker == id) {
                return true;
            }
        }
        return false;
    };

    this.getMarkerById = function (id) {
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            var id_marker = marker.id;
            if (id_marker == id) {
                return marker;
            }
        }
        return 0;
    };

    this.moveMarker = function (marker, newPosition) {
        var start_position = marker.position;
        var latLngStart = marker.getPosition();
        //console.log(latLng);
        var e = 0.00001;

        if (Math.abs(latLngStart.lat() - newPosition.lat()) > e
            || Math.abs(latLngStart.lng() - newPosition.lng()) > e
        ) {
            marker.animateTo(newPosition, {duration: 3000});
        }

    };

    this.drawPath = function (pathCoord, code) {
        var color = colors[Math.floor(Math.random() * colors.length)];
        var mapPath = new google.maps.Polyline({
            zIndex: -100,
            optimized: false,
            path: pathCoord,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.75,
            strokeWeight: 5
        });

        mapPath.setMap(map);
        paths[code] = mapPath;
    };

    this.removePath = function (code) {
        var mapPath = paths[code];
        if (!mapPath) return;
        mapPath.setMap(null);
        delete paths[code];
    };

    this.deleteMarkersByCode = function (code) {
        markers = markers.filter(function (marker) {
            if (marker.routeCode == code) {
                marker.setMap(null);
                return false;
            }
            return true;
        });
    };

}


window.initMap = function () {
    mapCanvas = $('#map');

    map = mapCanvas.googleMap({
        zoom: 15,
        center: {lat: 49.802829, lng: 24.00145},
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        disableDefaultUI: true
    });

    map.initialize();
    mapUtil = new MapUtil(mapCanvas.data('map'));


    $(".clear-marker").click(function () {
        mapUtil.deleteMarkers();
    });

};

