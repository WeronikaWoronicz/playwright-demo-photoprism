import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Multiple photo upload', () => {
  test('TC-UPL-002 User can upload multiple photos and see them in library @P1', async ({ uploadPage, page }) => {
    const file1 = path.join(process.cwd(), 'test-assets', 'photo-1.jpg');
    const file2 = path.join(process.cwd(), 'test-assets', 'photo-2.jpg');
    const file3 = path.join(process.cwd(), 'test-assets', 'photo-3.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles([file1, file2, file3]);
    await uploadPage.waitForUploadComplete();

    await uploadPage.waitForPhotoInLibrary();

    await uploadPage.navigateToLibrary();
    const count = await page.locator('.is-photo[data-uid]').count();
    expect(count).toBeGreaterThanOrEqual(3);

    const uids = await uploadPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(3);
  });
});
