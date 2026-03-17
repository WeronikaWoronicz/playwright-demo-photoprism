import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL, photoprism } from '../../../config.js';
import { loginViaAPI } from '../../../lib/auth.js';

test.describe('API Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-AUTH-005 User can log in via API @P0', async ({ page, context, loginPage }) => {
    await loginViaAPI(photoprism.username, photoprism.password, context);
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(/library\/browse/);
    await loginPage.clickPhotoprismLogoMenu();
    await expect(page.getByTitle('admin')).toBeVisible();
    const sessionToken = await page.evaluate(() => localStorage.getItem('session.token'));
    expect(sessionToken).toMatch(/^[a-z0-9]+$/);
    const sessionId = await page.evaluate(() => localStorage.getItem('session.id'));
    expect(sessionId).toMatch(/^[a-z0-9]+$/);
  });
});
