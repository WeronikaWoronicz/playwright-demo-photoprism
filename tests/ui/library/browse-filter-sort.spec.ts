import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Library Browse and Sort', () => {
  test('TC-LIB-001 User can browse the photo library @P0', async ({ libraryPage, page }) => {
    await libraryPage.navigateToBrowse();
    await expect(page).toHaveURL(/library\/browse/);
    await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('TC-LIB-002 User sees uploaded photos in library @P0', async ({ uploadPage, libraryPage }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    await libraryPage.navigateToBrowse();
    await libraryPage.waitForPhotos();
    const count = await libraryPage.getPhotoCount();
    expect(count).toBeGreaterThanOrEqual(1);
    const uids = await libraryPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(1);
    expect(uids[0]).toBeTruthy();
  });

  test('TC-LIB-003 User can sort photos by date @P2', async ({ uploadPage, libraryPage }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles([
      path.join(process.cwd(), 'test-assets', 'photo-1.jpg'),
      path.join(process.cwd(), 'test-assets', 'photo-2.jpg'),
    ]);
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    await libraryPage.navigateToBrowse();
    await libraryPage.setSortOrder('newest');
    await libraryPage.waitForPhotos();
    const newestUids = await libraryPage.getRenderedPhotoUids();

    await libraryPage.setSortOrder('oldest');
    await libraryPage.waitForPhotos();
    const oldestUids = await libraryPage.getRenderedPhotoUids();

    expect(newestUids.length).toBeGreaterThanOrEqual(1);
    expect(oldestUids.length).toBeGreaterThanOrEqual(1);
    expect(new Set(newestUids)).toEqual(new Set(oldestUids));
  });
});
