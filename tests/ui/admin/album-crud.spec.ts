import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';
import { getAdminAuthPath } from '../../../lib/auth-paths.js';

test.describe.serial('Album CRUD', () => {
  test.use({ storageState: getAdminAuthPath(process.env['TEST_PARALLEL_INDEX'] ?? '0') });

  test('TC-ALB-001 User can create an album through UI @P0', async ({ albumPage, page }) => {
    const albumName = albumPage.uniqueName('E2E Test Album');
    await albumPage.navigateToAlbums();
    await albumPage.clickAddAlbum();
    await albumPage.typeAlbumName(albumName);
    await albumPage.confirmCreate();

    const titles = await albumPage.getAlbumTitles();
    expect(titles.map((t) => t.trim())).toContain(albumName);
    await expect(page).toHaveURL(/albums/);
  });

  test('TC-ALB-002 User sees created album on albums page @P0', async ({ albumPage, page }) => {
    const albumName = albumPage.uniqueName('E2E Test Album');
    await albumPage.navigateToAlbums();
    await albumPage.clickAddAlbum();
    await albumPage.typeAlbumName(albumName);
    await albumPage.confirmCreate();

    await albumPage.navigateToAlbums();
    await expect(page).toHaveURL(/albums/);

    const count = await albumPage.getAlbumCount();
    expect(count).toBeGreaterThanOrEqual(1);

    const visible = await albumPage.isAlbumVisible(albumName);
    expect(visible).toBe(true);
  });

  test('TC-ALB-003 User can add photos to an album @P0', async ({ uploadPage, albumPage }) => {
    const albumName = albumPage.uniqueName('E2E Test Album');
    const albumUid = await albumPage.createAlbumViaAPI(albumName);

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'album-crud', 'album-add-photo.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const uploadedPhotoUid = uploadPage.trackedUids[0];
    await albumPage.addPhotosToAlbumViaAPI(albumUid, [uploadedPhotoUid]);

    await expect
      .poll(
        async () => {
          const photos = await albumPage.getAlbumPhotosViaAPI(albumUid);
          return photos.map((p) => p.UID);
        },
        { timeout: 30000 }
      )
      .toContain(uploadedPhotoUid);
  });
});
