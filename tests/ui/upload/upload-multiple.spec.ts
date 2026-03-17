import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Multiple photo upload', () => {
  test('TC-UPL-002 User can upload multiple photos and see them in library @P1', async ({
    uploadPage,
    page,
    libraryPage,
  }) => {
    const file1 = createPath('test-assets', 'upload-multiple', 'multi-upload-1.jpg');
    const file2 = createPath('test-assets', 'upload-multiple', 'multi-upload-2.jpg');
    const file3 = createPath('test-assets', 'upload-multiple', 'multi-upload-3.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles([file1, file2, file3]);
    await uploadPage.waitForUploadComplete();

    await uploadPage.waitForPhotoInLibrary();

    await uploadPage.navigateToLibrary();
    const uids = await uploadPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(3);

    const trackedUid = uploadPage.trackedUids[0];
    const tileBox = await libraryPage.getPhotoTile(trackedUid).boundingBox();
    await expect(page).toHaveScreenshot('uploaded-multiple-first-tile.png', {
      clip: { x: tileBox!.x, y: tileBox!.y, width: 300, height: 388 },
    });
  });
});
