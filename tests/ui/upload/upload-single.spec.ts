import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Single photo upload', () => {
  test('TC-UPL-001 User can upload a single photo and see it in library @P0', async ({ uploadPage, pageErrors }) => {
    const file = path.join(process.cwd(), 'test-assets', 'photo-1.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(file);
    await uploadPage.waitForUploadComplete();

    await uploadPage.waitForPhotoInLibrary();

    await uploadPage.navigateToLibrary();
    const uids = await uploadPage.getRenderedPhotoUids();
    expect(uids.length).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toHaveLength(0);
  });
});
