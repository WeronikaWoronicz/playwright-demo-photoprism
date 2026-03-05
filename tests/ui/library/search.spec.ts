import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';

test.describe('Library Search', () => {
  test('TC-LIB-004 User sees empty state when search returns no results @P1', async ({ page, searchPage }) => {
    await page.goto(BASE_URL + '/library/browse');
    await searchPage.search('xyznonexistentquery12345');
    const count = await searchPage.getResultCount();
    expect(count).toBe(0);
  });

  test('TC-LIB-005 User can find uploaded photo via search @P0', async ({ uploadPage, searchPage, page }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    await page.goto(BASE_URL + '/library/browse');
    await expect
      .poll(
        async () => {
          await searchPage.search('photo');
          await page.waitForTimeout(500);
          return searchPage.getResultCount();
        },
        { timeout: 30000 }
      )
      .toBeGreaterThanOrEqual(1);
  });
});
