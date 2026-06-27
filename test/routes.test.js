const { test } = require('node:test');
const assert = require('node:assert/strict');

test('routes module loads without throwing', () => {
    assert.doesNotThrow(() => require('../routes/index'));
});

test('/json route is registered on the router', () => {
    const router = require('../routes/index');
    // Express router exposes its registered layers via .stack
    const paths = router.stack
        .filter(layer => layer.route)
        .map(layer => layer.route.path);
    assert.ok(paths.includes('/json'), `registered paths: ${paths.join(', ')}`);
});
