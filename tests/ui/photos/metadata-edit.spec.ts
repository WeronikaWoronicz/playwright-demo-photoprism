import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { generatePhotoMetadata } from '../../../fixtures/testData/photoData.js';
import { createPath } from '../../../lib/assets.js';

test.describe('Photo Metadata Edit', () => {
  test('TC-PHO-001 User can edit photo title and verify persistence @P1', async ({
    uploadPage,
    libraryPage,
    photoDetailPage,
    page,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'metadata-edit', 'title-edit-target.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary(1, 'title-edit-target.jpg');

    const uid = uploadPage.trackedUids[0];
    expect(uid).toBeTruthy();

    await photoDetailPage.openPhoto(uid);
    await photoDetailPage.openEditPanel();

    const metadata = generatePhotoMetadata(42);
    await photoDetailPage.editTitle(metadata.title);
    await photoDetailPage.saveChanges();

    await page.reload();
    await libraryPage.waitForPhotos();
    await photoDetailPage.openPhoto(uid);
    await photoDetailPage.openEditPanel();
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(metadata.title);
    await expect(page.locator('.p-photo-edit-dialog')).toHaveScreenshot('edit-panel-persisted-title.png');
  });
});
