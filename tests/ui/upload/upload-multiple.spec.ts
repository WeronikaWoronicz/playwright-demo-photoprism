import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Multiple photo upload', () => {
  test('TC-UPL-002 User can upload multiple photos and see them in library @P1', async ({ uploadPage }) => {
    const file1 = createPath('test-assets', 'upload-multiple', 'photo-1.jpg');
    const file2 = createPath('test-assets', 'upload-multiple', 'photo-2.jpg');
    const file3 = createPath('test-assets', 'upload-multiple', 'photo-3.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles([file1, file2, file3]);
    await uploadPage.waitForUploadComplete();

    await uploadPage.waitForPhotoInLibrary();

    await uploadPage.navigateToLibrary();
    const uids = await uploadPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(3);
  });
});
