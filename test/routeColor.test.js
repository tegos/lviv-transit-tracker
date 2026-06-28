const { test } = require('node:test');
const assert = require('node:assert/strict');

const COLORS = ['#a', '#b', '#c', '#d', '#e'];

test('colorForCode is deterministic and in range', async () => {
    const { colorForCode } = await import('../src/routeColor.js');
    assert.equal(colorForCode('5', COLORS), colorForCode('5', COLORS));
    assert.ok(COLORS.includes(colorForCode('5', COLORS)));
    assert.ok(COLORS.includes(colorForCode(42, COLORS)));
});

test('colorForCode spreads different codes (not all identical)', async () => {
    const { colorForCode } = await import('../src/routeColor.js');
    const seen = new Set(['1', '2', '3', '4', '5', '6', '7', '8'].map(c => colorForCode(c, COLORS)));
    assert.ok(seen.size > 1, 'expected more than one distinct color across codes');
});
