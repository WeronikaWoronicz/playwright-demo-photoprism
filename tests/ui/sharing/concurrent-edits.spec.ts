import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { getPhotos } from '../../../lib/photoprism-api.js';
import { PhotoDetailPage } from '../../../pages/PhotoDetailPage.js';
import { BASE_URL } from '../../../config.js';

test.describe('Concurrent Edits', () => {
  test('TC-CONC-001 User sees last-write-wins when two users edit the same photo title concurrently @P2', async ({
    uploadPage,
    page,
    browser,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(path.join(process.cwd(), 'test-assets', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const photos = await getPhotos(page, 1);
    expect(photos.length).toBeGreaterThanOrEqual(1);
    const uid = photos[0].UID;

    const [context1, context2] = await Promise.all([
      browser.newContext({ storageState: 'playwright/.auth/adminState.json' }),
      browser.newContext({ storageState: 'playwright/.auth/adminState.json' }),
    ]);
    const [page1, page2] = await Promise.all([context1.newPage(), context2.newPage()]);

    await Promise.all([page1.goto(BASE_URL + '/library/browse'), page2.goto(BASE_URL + '/library/browse')]);
    const photoSelector = `.is-photo[data-uid="${uid}"]`;
    await Promise.all([
      page1.locator(photoSelector).waitFor({ timeout: 15000 }),
      page2.locator(photoSelector).waitFor({ timeout: 15000 }),
    ]);
    await Promise.all([page1.locator(photoSelector).click(), page2.locator(photoSelector).click()]);

    const photoDetailPage1 = new PhotoDetailPage(page1);
    const photoDetailPage2 = new PhotoDetailPage(page2);
    await Promise.all([photoDetailPage1.openEditPanel(), photoDetailPage2.openEditPanel()]);

    await photoDetailPage1.editTitle('Title From User 1');
    await Promise.all([
      page1.waitForResponse((resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      }),
      photoDetailPage1.saveChanges(),
    ]);

    await photoDetailPage2.editTitle('Title From User 2');
    await Promise.all([
      page2.waitForResponse((resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      }),
      photoDetailPage2.saveChanges(),
    ]);

    await context1.close();
    await context2.close();

    const updatedPhotos = await getPhotos(page, 1);
    expect(updatedPhotos.length).toBeGreaterThanOrEqual(1);
    const updatedPhoto = updatedPhotos[0] as { UID: string; OriginalName: string; Title: string };
    expect(updatedPhoto.Title).toBe('Title From User 2');
  });
});
