import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Invalid file upload', () => {
  test('TC-UPL-004 User sees no photo record after uploading non-image file @P1', async ({
    uploadPage,
    libraryPage,
  }) => {
    const invalidFile = createPath('test-assets', 'photo-invalid.txt');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(invalidFile);
    await uploadPage.waitForUploadComplete();

    await uploadPage.navigateToLibrary();
    const count = await libraryPage.getPhotoCount();
    expect(count).toBe(0);
  });
});
