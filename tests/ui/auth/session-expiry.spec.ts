import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';

test.describe('Session Expiry', () => {
  test('TC-AUTH-007 User sees login page after session tokens are cleared @P0', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).not.toHaveURL(/login/);

    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();

    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });
});
