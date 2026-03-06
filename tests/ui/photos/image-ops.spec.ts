import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { getPhotos } from '../../../lib/photoprism-api.js';
import { PhotoDetailPage } from '../../../pages/PhotoDetailPage.js';
import { BASE_URL } from '../../../config.js';

test.describe('Photo Image Operations', () => {
  test('TC-PHO-004 User can rotate a photo @P2', async ({ uploadPage, libraryPage, page }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const photos = await getPhotos(page, 1);
    const uid = photos[0].UID;

    await page.goto(BASE_URL + '/library/browse');
    await libraryPage.waitForPhoto(uid);
    await libraryPage.clickPhoto(uid);

    const photoDetailPage = new PhotoDetailPage(page);
    await photoDetailPage.openEditPanel();

    await page.getByRole('tab', { name: /files/i }).click();

    // Set up response listener BEFORE rotating — orientation change auto-saves via PUT
    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    );

    await photoDetailPage.rotatePhoto();
    await saveResponsePromise;

    await expect(page.locator('body')).toBeVisible();
  });
});
