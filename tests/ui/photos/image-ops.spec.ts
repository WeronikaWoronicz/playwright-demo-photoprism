import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { PhotoDetailPage } from '../../../pages/PhotoDetailPage.js';
import { BASE_URL } from '../../../config.js';
import { createPath } from '../../../lib/assets.js';

test.describe('Photo Image Operations', () => {
  test('TC-PHO-004 User can rotate a photo @P2', async ({ uploadPage, libraryPage, page }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'image-ops', 'rotate-target.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const uid = uploadPage.trackedUids[0];

    await page.goto(BASE_URL + '/library/browse');
    await libraryPage.waitForPhoto(uid);
    await libraryPage.clickPhoto(uid);

    const photoDetailPage = new PhotoDetailPage(page);
    await photoDetailPage.openEditPanel(uid);

    await page.getByRole('tab', { name: /files/i }).click();

    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    );

    await photoDetailPage.rotatePhoto();
    await saveResponsePromise;

    await page.goto(BASE_URL + '/library/browse');
    await page.locator(`.is-photo[data-uid="${uid}"]`).waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.locator(`.is-photo[data-uid="${uid}"]`)).toHaveScreenshot('photo-tile-after-rotation.png');
  });
});
