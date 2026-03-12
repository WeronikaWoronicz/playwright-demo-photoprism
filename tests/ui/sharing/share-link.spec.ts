import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';
import { createPath } from '../../../lib/assets.js';

test.describe('Public Share Link', () => {
  test('TC-SHR-001 User sees authentication required for non-shared photo URL @P1', async ({ browser }) => {
    const unauthContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const unauthPage = await unauthContext.newPage();

    await unauthPage.goto(`${BASE_URL}/library/browse`);
    await expect(unauthPage).toHaveURL(/login/, { timeout: 10000 });

    await unauthContext.close();
  });

  test('TC-SHR-002 User can create a share link accessible without auth @P0', async ({
    uploadPage,
    sharePage,
    page,
    browser,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'share-link', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const photoUid = uploadPage.trackedUids[0];
    expect(photoUid).toBeTruthy();

    const token = await sharePage.createShareLink(photoUid, page.request);
    expect(token).toBeTruthy();

    const unauthCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const unauthPage = await unauthCtx.newPage();
    const shareUrl = sharePage.getShareUrl(token);
    const response = await unauthPage.goto(shareUrl);
    expect(response?.status()).toBe(200);
    await expect(unauthPage).not.toHaveURL(/login/);
    await expect(unauthPage.locator('main')).toBeVisible();
    await unauthCtx.close();
  });
});
