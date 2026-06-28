const config = require('../config');

const apiUrl = {
    getBusUrl: () => `${config.apiBaseUrl}/routes.json`,
    getRouteUrl: (name) => `${config.apiBaseUrl}/routes/dynamic/${encodeURIComponent(name)}`,
    getPathUrl: (name) => `${config.apiBaseUrl}/routes/static/${encodeURIComponent(name)}`
};

module.exports = apiUrl;
