import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { generatePhotoMetadata } from '../../../fixtures/testData/photoData.js';

test.describe('Photo Metadata Edit', () => {
  test('TC-PHO-001 User can edit photo title and verify persistence @P1', async ({
    uploadPage,
    libraryPage,
    photoDetailPage,
    page,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    await libraryPage.navigateToBrowse();
    await libraryPage.waitForPhotos();
    const uids = await libraryPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(1);
    const uid = uids[0];

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
  });
});
