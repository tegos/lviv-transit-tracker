const express = require('express');
const router = express.Router();

const model = require('../models/model');

/* about page. */
router.get('/about', function (req, res, next) {
    res.render('pages/about', { title: 'About' });
});

/* GET home page. */
router.get('/', async function (req, res, next) {
    const view_data = {title: 'LvivTransportMonitoringExpress'};

    try {
        const response = await model.getBuses();
        const content = response.getBody();
        const stops = JSON.parse(content);

        stops.forEach(function (stop, key) {
            const words = stop['Name'].split(" ");
            stop['SmallName'] = words[0];
            stops[key] = stop;
        });

        view_data.stops = stops;

        return res.render('pages/index', view_data);
    } catch (error) {
        let errorMessage = "Request Failed";
        if (error.code && error.body) {
            errorMessage += " - " + error.code + ": " + error.body;
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
