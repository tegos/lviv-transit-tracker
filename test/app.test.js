const { test } = require('node:test');
const assert = require('node:assert/strict');

test('app module loads without throwing', () => {
    assert.doesNotThrow(() => require('../app'));
});
