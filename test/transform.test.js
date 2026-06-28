const { test } = require('node:test');
const assert = require('node:assert/strict');

const { toVehicles, toPath, isValidRouteId } = require('../socket/transform');

test('toVehicles maps api vehicles to the client shape', () => {
    const raw = [{ id: 'v1', location: [49.84, 24.03], bearing: 90 }];
    assert.deepEqual(toVehicles(raw, '27'), [
        { id: 'v1', lat: 49.84, lng: 24.03, bearing: 90, routeCode: '27', name: 'v1' },
    ]);
});

test('toPath maps shapes[0] lat/lng pairs to {lat, lng} points', () => {
    const shapes = [[[49.84, 24.03], [49.85, 24.04]]];
    assert.deepEqual(toPath(shapes), [
        { lat: 49.84, lng: 24.03 },
        { lat: 49.85, lng: 24.04 },
    ]);
});

test('toPath returns empty array when shapes is empty', () => {
    assert.deepEqual(toPath([]), []);
    assert.deepEqual(toPath(undefined), []);
});

test('isValidRouteId accepts short strings, rejects non-strings and long input', () => {
    assert.equal(isValidRouteId('27'), true);
    assert.equal(isValidRouteId(''), false);
    assert.equal(isValidRouteId(27), false);
    assert.equal(isValidRouteId('x'.repeat(21)), false);
});
