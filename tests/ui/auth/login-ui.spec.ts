import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL, photoprism } from '../../../config.js';

test.describe('UI Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-AUTH-001 User can log in as admin via UI @P0', async ({ page, loginPage }) => {
    await page.goto(BASE_URL);
    await loginPage.login(photoprism.username, photoprism.password);
    await page.waitForURL(`${BASE_URL}/library/browse`);
    await loginPage.clickPhotoprismLogoMenu();
    await expect(page.getByTitle('admin')).toBeVisible();
    await loginPage.clickAdminTitle();
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toHaveValue('Admin');
  });
});
