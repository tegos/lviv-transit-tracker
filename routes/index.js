const express = require('express');
const router = express.Router();

const model = require('../models/model');
const config = require('../config');

/* about page. */
router.get('/about', function (req, res, next) {
    res.render('pages/about', { title: 'About', googleMapsKey: config.googleMapsKey });
});

/* GET home page. */
router.get('/', async function (req, res, next) {
    const view_data = {title: 'LvivTransportMonitoringExpress', googleMapsKey: config.googleMapsKey};

    try {
        const response = await model.getBuses();
        const content = response.getBody();
        const routes = JSON.parse(content);

        routes.forEach(function (route, key) {
            route['Name'] = route['long_name'];
            route['SmallName'] = route['short_name'];
            route['Code'] = route['short_name'];
            route['Id'] = route['external_id'];
            routes[key] = route;
        });

        view_data.stops = routes;

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
        const response = await model.getBuses();
        const content = response.getBody();
        const json = JSON.parse(content);
        res.send(json);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Internal Server Error"
        });
    }
});

module.exports = router;
