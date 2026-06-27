/**
 * Created by tegos on 14.03.2017.
 */



var defaultUpdate = function (data, routeCode) {

    //var length_data = data.length;

    data.forEach(function (route) {
        //console.log(route);
        var x = route.X;
        var y = route.Y;
        var busId = route.VehicleId;

        var nameRoute = route.RouteName;
        var angle = route.Angle;

        var BusNumber = route.VehicleName;

        var positionBus = new google.maps.LatLng(y, x);


        // exist on map -> need move
        if (mapUtil.isMarkerOnMap(busId)) {
            var marker = mapUtil.getMarkerById(busId);
            mapUtil.moveMarker(marker, positionBus);

        } else { // need create

            var contentString = 'Маршрут: <b>' + nameRoute + '</b><br/>' + 'ТЗ: <b>' + BusNumber + '</b>';
            //Set window width + content
            var infowindow = new google.maps.InfoWindow({
                content: contentString,
                maxWidth: 500
            });

            mapUtil.addMarker(positionBus, busId, infowindow, angle, routeCode);
        }

        //console.dir(data);
    });

};


var drawRoute = function (data) {
    var flightPlanCoordinates = [];

    data.path.forEach(function (dataPath) {
        flightPlanCoordinates.push(
            new google.maps.LatLng(dataPath.Y, dataPath.X)
        );
    });

    mapUtil.drawPath(flightPlanCoordinates, data.code);
};

var eventRemoveRoute = function (code_route) {

    mapUtil.removePath(code_route);
    mapUtil.deleteMarkersByCode(code_route);

};

var eventAddRoute = function (code_route) {

};

