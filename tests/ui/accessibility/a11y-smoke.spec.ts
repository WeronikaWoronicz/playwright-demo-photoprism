import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';
import { checkA11y } from '../../../lib/accessibility.js';

test.describe('Accessibility Smoke Tests', () => {
  test('TC-A11Y-001 User sees no critical a11y violations on login page @P1', async ({ browser }) => {
    // Use a fresh unauthenticated context so addInitScript doesn't re-inject auth
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const unauthPage = await ctx.newPage();
    await unauthPage.goto(BASE_URL + '/library/login');
    await checkA11y(unauthPage);
    await ctx.close();
  });

  test('TC-A11Y-002 User sees no critical a11y violations on library browse page @P1', async ({ libraryPage, a11yCheck }) => {
    await libraryPage.navigateToBrowse();
    await a11yCheck();
  });

  test('TC-A11Y-003 User sees no critical a11y violations on upload form @P1', async ({ uploadPage, a11yCheck }) => {
    await uploadPage.navigateToUploadForm();
    await a11yCheck();
  });

  test('TC-A11Y-004 User sees no critical a11y violations on albums page @P1', async ({ albumPage, a11yCheck }) => {
    await albumPage.navigateToAlbums();
    await a11yCheck();
  });

  test('TC-A11Y-005 User sees no critical a11y violations on settings page @P1', async ({ adminPage, a11yCheck }) => {
    await adminPage.navigateToSettings();
    await a11yCheck();
  });

  test('TC-A11Y-006 User can navigate main nav items via keyboard Tab @P2', async ({ page, libraryPage }) => {
    await libraryPage.navigateToBrowse();

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expect(page.locator(':focus')).not.toHaveAttribute('tabindex', '-1');

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])');
      return focusable.length;
    });
    expect(focusableCount).toBeGreaterThan(0);
  });
});
