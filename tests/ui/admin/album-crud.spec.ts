import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe.serial('Album CRUD', () => {
  test.use({ storageState: 'playwright/.auth/adminState.json' });

  test('TC-ALB-001 User can create an album through UI @P0', async ({ albumPage, page }) => {
    await albumPage.navigateToAlbums();
    await albumPage.clickAddAlbum();
    await albumPage.typeAlbumName('E2E Test Album');
    await albumPage.confirmCreate();

    const titles = await albumPage.getAlbumTitles();
    expect(titles.map((t) => t.trim())).toContain('E2E Test Album');
    await expect(page).toHaveURL(/albums/);
  });

  test('TC-ALB-002 User sees created album on albums page @P0', async ({ albumPage, page }) => {
    await albumPage.navigateToAlbums();
    await albumPage.clickAddAlbum();
    await albumPage.typeAlbumName('E2E Test Album');
    await albumPage.confirmCreate();

    await albumPage.navigateToAlbums();
    await expect(page.locator('main')).toBeVisible();

    const count = await albumPage.getAlbumCount();
    expect(count).toBeGreaterThanOrEqual(1);

    const visible = await albumPage.isAlbumVisible('E2E Test Album');
    expect(visible).toBe(true);
  });

  test('TC-ALB-003 User can add photos to an album @P0', async ({ uploadPage, albumPage, libraryPage }) => {
    const albumUid = await albumPage.createAlbumViaAPI('E2E Test Album');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'album-crud', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const photoUids = await libraryPage.getRenderedPhotoUids();
    await albumPage.addPhotosToAlbumViaAPI(albumUid, photoUids.slice(0, 1));

    await expect
      .poll(
        async () => {
          const photos = await albumPage.getAlbumPhotosViaAPI(albumUid);
          return photos.length;
        },
        { timeout: 30000 }
      )
      .toBeGreaterThanOrEqual(1);
  });
});
