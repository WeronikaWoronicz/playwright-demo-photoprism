import path from 'path';
import { test } from '../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Photo upload flows', () => {
  test('Upload a single photo', async ({ uploadPage }) => {
    const filePath = path.resolve(process.cwd(), 'test-assets', 'photo-1.jpg');

    // Upload flow
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(filePath);
    await uploadPage.waitForUploadComplete();

    // Approve in review section
    await uploadPage.navigateToReviewSection();
    await uploadPage.approveAllPhotos();

    // Verify in library
    await uploadPage.navigateToLibrary();
    await expect(uploadPage['page'].locator('img')).toHaveCount(1);
    await expect(uploadPage['page']).toHaveScreenshot();
  });

  test('Upload multiple photos and approve them', async ({ uploadPage }) => {
    const filesPath = [
      path.resolve(process.cwd(), 'test-assets', 'photo-2.jpg'),
      path.resolve(process.cwd(), 'test-assets', 'photo-3.jpg'),
      path.resolve(process.cwd(), 'test-assets', 'photo-4.jpg'),
    ];

    // Upload flow
    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(filesPath);
    await uploadPage.waitForUploadComplete();

    // Approve in review section
    await uploadPage.navigateToReviewSection();
    await uploadPage.approveAllPhotos();

    // Verify navigation to library
    await uploadPage.navigateToLibrary();
    await expect(uploadPage['page'].locator('img')).toHaveCount(3);
    await expect(uploadPage['page']).toHaveURL(/\/library\/browse/);
  });
});
