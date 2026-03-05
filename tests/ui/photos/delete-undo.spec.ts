import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Photo Delete', () => {
  test('TC-PHO-003 User can delete a photo @P1', async ({ uploadPage, libraryPage, photoDetailPage }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    await libraryPage.navigateToBrowse();
    await libraryPage.waitForPhotos();
    const countBefore = await libraryPage.getPhotoCount();
    expect(countBefore).toBeGreaterThanOrEqual(1);

    await libraryPage.selectFirstPhoto();
    await photoDetailPage.archiveSelectedPhoto();

    await libraryPage.navigateToBrowse();
    const countAfter = await libraryPage.getPhotoCount();
    expect(countAfter).toBe(countBefore - 1);
  });
});
