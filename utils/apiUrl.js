var config = require('../config');

var SimpleRIDE_URL = config.apiUrl;

var apiUrl = {
    getBusUrl: function () {
        var url = SimpleRIDE_URL + 'CompositeRoute/';
        return url;
    },
    getRouteUrl: function (code) {
        return SimpleRIDE_URL + 'RouteMonitoring/?code=' + code;
    },
    getPathUrl: function (code) {
        return SimpleRIDE_URL + 'path/?code=' + code;
    }
};


module.exports = apiUrl;