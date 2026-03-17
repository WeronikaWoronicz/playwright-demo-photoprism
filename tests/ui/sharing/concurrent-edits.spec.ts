import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { PhotoDetailPage } from '../../../pages/PhotoDetailPage.js';
import { LibraryPage } from '../../../pages/LibraryPage.js';
import { BASE_URL } from '../../../config.js';
import { createPath } from '../../../lib/assets.js';
import { getAdminAuthPath } from '../../../lib/auth-paths.js';

test.describe('Concurrent Edits', () => {
  test('TC-CONC-001 User sees last-write-wins when two users edit the same photo title concurrently @P2', async ({
    uploadPage,
    page,
    browser,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'concurrent-edits', 'concurrent-title-edit.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const uid = uploadPage.trackedUids[0];
    expect(uid).toBeTruthy();

    const [context1, context2] = await Promise.all([
      browser.newContext({ storageState: getAdminAuthPath(test.info().workerIndex) }),
      browser.newContext({ storageState: getAdminAuthPath(test.info().workerIndex) }),
    ]);
    const [page1, page2] = await Promise.all([context1.newPage(), context2.newPage()]);

    await Promise.all([page1.goto(BASE_URL + '/library/browse'), page2.goto(BASE_URL + '/library/browse')]);
    const libraryPage1 = new LibraryPage(page1);
    const libraryPage2 = new LibraryPage(page2);
    await Promise.all([libraryPage1.waitForPhoto(uid), libraryPage2.waitForPhoto(uid)]);
    await Promise.all([libraryPage1.clickPhoto(uid), libraryPage2.clickPhoto(uid)]);

    const photoDetailPage1 = new PhotoDetailPage(page1);
    const photoDetailPage2 = new PhotoDetailPage(page2);
    await Promise.all([photoDetailPage1.openEditPanel(uid), photoDetailPage2.openEditPanel(uid)]);

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

    const state = await page.context().storageState();
    const token = state.origins
      .flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name.endsWith('session.token'))?.value;
    const resp = await page.request.get(`${BASE_URL}/api/v1/photos/${uid}`, {
      headers: { 'X-Auth-Token': token ?? '' },
    });
    const updatedPhoto = (await resp.json()) as { UID: string; Title: string };
    expect(updatedPhoto.Title).toBe('Title From User 2');

    await page.goto(BASE_URL + '/library/browse');
    const libraryPageMain = new LibraryPage(page);
    const tile = libraryPageMain.getPhotoTile(uid);
    await tile.waitFor({ state: 'visible', timeout: 15000 });
    const box = await tile.boundingBox();
    await expect(page).toHaveScreenshot('photo-tile-last-write-wins.png', {
      clip: { x: box!.x, y: box!.y, width: 300, height: 388 },
    });
  });
});
