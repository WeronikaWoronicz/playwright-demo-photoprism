import { test } from '../fixtures/pages.js';
import { BASE_URL, photoprism } from '../config.js';

test.describe('Login to photoprism', () => {
test('Login as a admin', async ({ page, loginPage }) => {
    await page.goto(BASE_URL);
    await loginPage.fillUserName(photoprism.username);
    await loginPage.fillPassword(photoprism.password);
    await loginPage.clickSignInBtn();
    await loginPage.assertLoginSuccess();
});  

test('Login via API', async ({ page, loginPage }) => {
    await page.goto(BASE_URL);
    await loginPage.clickSignInBtn();
    await loginPage.loginViaAPI(photoprism.username, photoprism.password);
});
});