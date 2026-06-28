const { test } = require('node:test');
const assert = require('node:assert/strict');

const model = require('../models/model');

// Real network calls to api.lad.lviv.ua. Opt-in only, to keep the default
// suite offline and fast:  INTEGRATION=1 npm test
const run = process.env.INTEGRATION === '1';

test('getBuses returns a non-empty route list from the live API', { skip: !run }, async () => {
    const res = await model.getBuses();
    const routes = JSON.parse(res.getBody());
    assert.ok(Array.isArray(routes), 'expected an array of routes');
    assert.ok(routes.length > 0, 'expected at least one route');
    assert.ok('short_name' in routes[0], `route shape: ${Object.keys(routes[0]).join(', ')}`);
});

test('getRoutes returns vehicle data for a live route code', { skip: !run }, async () => {
    // Derive a real code from the route list so the test can't rot.
    const routes = JSON.parse((await model.getBuses()).getBody());
    const code = routes[0].short_name;
    const vehicles = JSON.parse((await model.getRoutes(code)).getBody());
    assert.ok(Array.isArray(vehicles), `expected an array of vehicles for ${code}`);
});
