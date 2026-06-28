const { test } = require('node:test');
const assert = require('node:assert/strict');

test('routes module loads without throwing', () => {
    assert.doesNotThrow(() => require('../routes/index'));
});

test('home, about, contact and json routes are registered', () => {
    const router = require('../routes/index');
    const paths = router.stack
        .filter(layer => layer.route)
        .map(layer => layer.route.path);
    for (const p of ['/', '/about', '/contact', '/json']) {
        assert.ok(paths.includes(p), `missing ${p}; registered: ${paths.join(', ')}`);
    }
});
