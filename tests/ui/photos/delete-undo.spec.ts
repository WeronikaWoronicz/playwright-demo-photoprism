import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Photo Delete', () => {
  test('TC-PHO-003 User can delete a photo @P1', async ({ uploadPage, libraryPage, photoDetailPage }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'delete-undo', 'delete-target.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const uid = uploadPage.trackedUids[0];
    expect(uid).toMatch(/^[a-z0-9]+$/);

    await libraryPage.navigateToBrowse();
    await libraryPage.waitForPhoto(uid);
    await libraryPage.selectPhoto(uid);
    await photoDetailPage.archiveSelectedPhoto();

    await libraryPage.navigateToBrowse();
    await libraryPage.waitForPhotoDisappearing(uid);

    await libraryPage.navigateToArchive();
    await libraryPage.waitForPhoto(uid);
    await expect(libraryPage.getPhotoTile(uid)).toBeVisible();
  });
});
