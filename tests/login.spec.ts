import { test } from '../fixtures/pages.js';
import { BASE_URL, photoprism } from '../config.js';

test.describe('Login to photoprism', () => {
test('Login as a admin', async ({ page, loginPage }) => {
    await page.goto(BASE_URL)
    
    await loginPage.fillUserName()
    await loginPage.fillPassword()
    await loginPage.clickSignInBtn()
});                  
});