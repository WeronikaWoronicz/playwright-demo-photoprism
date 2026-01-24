import { test } from '../fixtures/pages.js';
import { BASE_URL, photoprism } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';

test.describe('Login to photoprism', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('Login as an admin', async ({ page, loginPage }) => {
    await page.goto(BASE_URL);
    await loginPage.fillUserName(photoprism.username);
    await loginPage.fillPassword(photoprism.password);
    await loginPage.clickSignInBtn();
    await page.waitForURL(`${BASE_URL}/library/browse`);
    await loginPage.clickPhotoprismLogoMenu();
    await loginPage.assertLoginSuccess();
  });

  test('Login via API', async ({ page, context, loginPage }) => {
    await loginViaAPI(photoprism.username, photoprism.password, context);
    await page.goto(BASE_URL);
    await loginPage.clickPhotoprismLogoMenu();
    await loginPage.assertLoginSuccess();
  });
});
