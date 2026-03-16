import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Single photo upload', () => {
  test('TC-UPL-001 User can upload a single photo and see it in library @P0', async ({
    uploadPage,
    pageErrors,
    page,
  }) => {
    const file = createPath('test-assets', 'upload-single', 'single-upload.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(file);
    await uploadPage.waitForUploadComplete();

    await uploadPage.waitForPhotoInLibrary();

    await uploadPage.navigateToLibrary();
    const uids = await uploadPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(1);

    const trackedUid = uploadPage.trackedUids[0];
    const tileBox = await page.locator(`.is-photo[data-uid="${trackedUid}"]`).boundingBox();
    await expect(page).toHaveScreenshot('uploaded-single-photo-tile.png', {
      clip: { x: tileBox!.x, y: tileBox!.y, width: 300, height: 388 },
    });

    expect(pageErrors).toHaveLength(0);
  });
});
