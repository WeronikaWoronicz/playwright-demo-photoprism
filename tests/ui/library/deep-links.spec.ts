import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';

test.describe('URL Routing and Deep Links', () => {
  test('TC-LIB-007 User sees login redirect when accessing library unauthenticated @P0', async ({ browser }) => {
    // Create a fresh unauthenticated context to avoid addInitScript re-injecting auth
    const unauthCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const unauthPage = await unauthCtx.newPage();
    await unauthPage.goto(BASE_URL + '/library/browse');
    await expect(unauthPage).toHaveURL(/login/, { timeout: 10000 });
    await unauthCtx.close();
  });

  test('TC-LIB-008 User can navigate directly to library browse via deep link @P1', async ({ page, libraryPage }) => {
    await libraryPage.navigateToBrowse();
    await expect(page).toHaveURL(/library\/browse/);
    await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
  });

  test('TC-LIB-010 User sees graceful handling of non-existent routes @P2', async ({ page }) => {
    await page.goto(BASE_URL + '/nonexistent-route-xyz');
    await expect(page).toHaveURL(/library\/browse|library\/login|login/);
    await expect(page.locator('main')).toBeVisible();
  });
});
