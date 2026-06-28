const express = require('express');
const router = express.Router();

const model = require('../models/model');
const config = require('../config');
const createCache = require('../utils/routeCache');

const routeCache = createCache();

// Fetch + parse the route list, cached for routeCache's TTL.
async function getRouteList() {
    return routeCache.get(() => model.getBuses());
}

/* about page. */
router.get('/about', function (req, res, next) {
    res.render('pages/about', { title: 'About', googleMapsKey: config.googleMapsKey });
});

/* GET home page. */
router.get('/', async function (req, res, next) {
    const view_data = {title: 'LvivTransportMonitoringExpress', googleMapsKey: config.googleMapsKey};

    try {
        const routes = await getRouteList();

        // Build view objects without mutating the cached list (shared with /json).
        view_data.routes = routes.map(function (route) {
            return {
                ...route,
                Name: route['long_name'],
                SmallName: route['short_name'],
                Code: route['short_name'],
                Id: route['external_id'],
            };
        });

        return res.render('pages/index', view_data);
    } catch (error) {
        let errorMessage = "Request Failed";
        if (error.code && error.message) {
            errorMessage += " - " + error.code + ": " + error.message;
        }

        console.log(error);
        return res.status(400).send({
            message: errorMessage
        });
    }
});

/* GET Json Data */
router.get('/json', async function (req, res, next) {
    try {
        const json = await getRouteList();
        res.send(json);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Internal Server Error"
        });
    }
});

module.exports = router;
