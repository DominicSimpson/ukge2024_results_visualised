import { test, expect } from '@playwright/test';

test('loads the map and checks zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5500'); // ensure this shows correct local address

  // Check map is visible
  await expect(page.locator('#map')).toBeVisible();

  // Click the zoom in button
  await page.click('.leaflet-control-zoom-in');

  // Click the zoom out button
  await page.click('.leaflet-control-zoom-out');
});
