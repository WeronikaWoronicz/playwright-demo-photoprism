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

    const firstUid = uids[0];
    await expect(page.locator(`.is-photo[data-uid="${firstUid}"]`)).toHaveScreenshot('uploaded-single-photo-tile.png');

    expect(pageErrors).toHaveLength(0);
  });
});
