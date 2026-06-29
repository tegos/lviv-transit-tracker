const express = require('express');
const router = express.Router();

const config = require('../config');
const routeList = require('../services/routeList');

/* Liveness probe: no external I/O, so platform health checks stay decoupled
   from upstream api.lad.lviv.ua availability. */
router.get('/healthz', function (req, res) {
    res.status(200).json({ status: 'ok' });
});

/* about page. */
router.get('/about', function (req, res) {
    res.render('pages/about', { title: 'Про застосунок — Транспорт Львова Live', googleMapsKey: config.googleMapsKey });
});

/* contact page. */
router.get('/contact', function (req, res) {
    res.render('pages/contact', { title: 'Контакти — Транспорт Львова Live', googleMapsKey: config.googleMapsKey });
});

/* GET home page. */
router.get('/', async function (req, res) {
    const view_data = {title: 'Транспорт Львова Live - відстеження транспорту онлайн', googleMapsKey: config.googleMapsKey};

    try {
        const routes = await routeList.getRoutes();

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

        console.error(error);
        // Upstream/gateway failure, not a client error -> 502, so monitoring and
        // any health check keying on 5xx classify it correctly.
        return res.status(502).send({ message: errorMessage });
    }
});

/* GET Json Data */
router.get('/json', async function (req, res) {
    try {
        const json = await routeList.getRoutes();
        res.send(json);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: error.message || "Internal Server Error" });
    }
});

module.exports = router;
