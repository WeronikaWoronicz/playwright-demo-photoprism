import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../../config.js';
import { createPath } from '../../../lib/assets.js';

test.describe('Public Share Link', () => {
  test.describe('unauthenticated access', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC-SHR-001 User sees authentication required for non-shared photo URL @P1', async ({ page }) => {
      await page.goto(`${BASE_URL}/library/browse`);
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });

  test('TC-SHR-002 User can create a share link accessible without auth @P0', async ({
    uploadPage,
    sharePage,
    page,
    unauthPage,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'share-link', 'share-link-photo.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary(1, 'share-link-photo.jpg');

    const photoUid = uploadPage.trackedUids[0];
    expect(photoUid).toMatch(/^[a-z0-9]+$/);

    const token = await sharePage.createShareLink(photoUid, page.request);
    expect(token).toMatch(/^[a-z0-9]+$/);

    const shareUrl = sharePage.getShareUrl(token);
    const response = await unauthPage.goto(shareUrl);
    expect(response?.status()).toBe(200);
    await expect(unauthPage).not.toHaveURL(/login/);
    await expect(unauthPage.locator(`.is-photo[data-uid="${photoUid}"]`)).toBeVisible();
  });
});
