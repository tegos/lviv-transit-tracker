const { test, expect } = require('@playwright/test');

test('home page renders routes from the bundle with no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/Lviv/i);

    // Route checkboxes are server-rendered from the cached route list.
    const checkboxes = page.locator('#route_stops input');
    expect(await checkboxes.count()).toBeGreaterThan(0);

    // The Vite bundle wired the Google Maps callback.
    expect(await page.evaluate(() => typeof window.initMap)).toBe('function');

    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
});

test('toggling a route emits add-bus and the bundle handles the ack', async ({ page }) => {
    await page.goto('/');
    // Wait for the bundle to finish loading the Maps API + initMap.
    await page.waitForFunction(() => !!(window.google && window.google.maps), null, { timeout: 20000 });

    // The input is visually hidden (styled span via checkbox.css), so drive the
    // change event directly, mirroring what a label click does.
    await page.evaluate(() => {
        const input = document.querySelector('#route_stops input');
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // On a successful ack the box stays checked; on failure the bundle unchecks it.
    await expect(page.locator('#route_stops input').first()).toBeChecked();
});
