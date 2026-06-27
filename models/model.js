const apiUrl = require('../utils/apiUrl');

const DEFAULT_TIMEOUT = 60000;

async function get(url, timeout) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
            const body = await res.text();
            throw { code: res.status, body };
        }
        const body = await res.text();
        return { getBody: () => body };
    } finally {
        clearTimeout(id);
    }
}

const Model = {
    getBuses() {
        return get(apiUrl.getBusUrl(), DEFAULT_TIMEOUT);
    },
    getRoutes(code) {
        return get(apiUrl.getRouteUrl(code), DEFAULT_TIMEOUT);
    },
    getPathData(code) {
        return get(apiUrl.getPathUrl(code), DEFAULT_TIMEOUT);
    }
};

module.exports = Model;
