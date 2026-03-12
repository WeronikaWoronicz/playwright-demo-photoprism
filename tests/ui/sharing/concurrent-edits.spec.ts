import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { PhotoDetailPage } from '../../../pages/PhotoDetailPage.js';
import { LibraryPage } from '../../../pages/LibraryPage.js';
import { BASE_URL } from '../../../config.js';
import { createPath } from '../../../lib/assets.js';

test.describe('Concurrent Edits', () => {
  test('TC-CONC-001 User sees last-write-wins when two users edit the same photo title concurrently @P2', async ({
    uploadPage,
    page,
    browser,
  }) => {
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(createPath('test-assets', 'concurrent-edits', 'photo-1.jpg'));
    await uploadPage.waitForUploadComplete();
    await uploadPage.waitForPhotoInLibrary();

    const uid = uploadPage.trackedUids[0];
    expect(uid).toBeTruthy();

    const [context1, context2] = await Promise.all([
      browser.newContext({ storageState: 'playwright/.auth/adminState.json' }),
      browser.newContext({ storageState: 'playwright/.auth/adminState.json' }),
    ]);
    const [page1, page2] = await Promise.all([context1.newPage(), context2.newPage()]);

    await Promise.all([page1.goto(BASE_URL + '/library/browse'), page2.goto(BASE_URL + '/library/browse')]);
    const libraryPage1 = new LibraryPage(page1);
    const libraryPage2 = new LibraryPage(page2);
    await Promise.all([libraryPage1.waitForPhoto(uid), libraryPage2.waitForPhoto(uid)]);
    await Promise.all([libraryPage1.clickPhoto(uid), libraryPage2.clickPhoto(uid)]);

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

    const state = await page.context().storageState();
    const token = state.origins
      .flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name === 'session.token')?.value;
    const resp = await page.request.get(`${BASE_URL}/api/v1/photos/${uid}`, {
      headers: { 'X-Auth-Token': token ?? '' },
    });
    const updatedPhoto = (await resp.json()) as { UID: string; Title: string };
    expect(updatedPhoto.Title).toBe('Title From User 2');
  });
});
