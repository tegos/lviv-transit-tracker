const express = require('express');
const router = express.Router();

const model = require('../models/model');

/* about page. */
router.get('/about', function (req, res, next) {
    res.render('pages/about', { title: 'About' });
});

/* GET home page. */
router.get('/', function (req, res, next) {
    var view_data = {title: 'LvivTransportMonitoringExpress'};

    var buses = model.getBuses();

    buses.then(function (response) {
            var content = response.getBody();
            var stops = JSON.parse(content);

            stops.forEach(function (stop, key) {
                var words = stop['Name'].split(" ");
                stop['SmallName'] = words[0];
                stops[key] = stop;
            });

            view_data.stops = stops;

            return res.render('pages/index',
                view_data
            );
        }, function (error) {
            let errorMessage = "Request Failed";
            if (error.code && error.body) {
                errorMessage += " - " + error.code + ": " + error.body
            }

            console.log(error);
            return res.status(400).send({
                message: errorMessage
            });
        }
    );

});

/* GET Json Data */
router.get('/json', function (req, res, next) {
    console.log('get json');

    var buses = model.getBuses();

    buses.then(function (response) {
            var content = response.getBody();
            var json = JSON.parse(content);
            res.send(json);
        }
    );

});

module.exports = router;
