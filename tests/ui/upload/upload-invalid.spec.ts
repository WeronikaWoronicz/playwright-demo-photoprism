import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Invalid file upload', () => {
  test('TC-UPL-004 User sees no photo record after uploading non-image file @P1', async ({ uploadPage, page }) => {
    const invalidFile = createPath('test-assets', 'invalid-file.txt');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(invalidFile);
    await uploadPage.waitForUploadComplete();

    await expect.poll(async () => uploadPage.getNewPhotoCount(), { timeout: 15000 }).toBe(0);

    await uploadPage.navigateToLibrary();
    await expect(page.getByRole('textbox', { name: /search/i })).toHaveScreenshot('library-after-invalid-upload.png');
  });
});
