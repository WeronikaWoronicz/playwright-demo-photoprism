import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Invalid file upload', () => {
  test('TC-UPL-004 User sees no photo record after uploading non-image file @P1', async ({ uploadPage }) => {
    const invalidFile = path.join(process.cwd(), 'test-assets', 'photo-invalid.txt');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(invalidFile);
    await uploadPage.waitForUploadComplete();

    await uploadPage.navigateToLibrary();
    const count = await uploadPage.page.locator('.is-photo').count();
    expect(count).toBe(0);
  });
});
