const BASE_URL = 'https://api.lad.lviv.ua';

const apiUrl = {
    getBusUrl: () => `${BASE_URL}/routes.json`,
    getRouteUrl: (name) => `${BASE_URL}/routes/dynamic/${encodeURIComponent(name)}`,
    getPathUrl: (name) => `${BASE_URL}/routes/static/${encodeURIComponent(name)}`
};

module.exports = apiUrl;
