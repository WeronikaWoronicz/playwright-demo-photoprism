import path from 'path';
import { test } from '../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../config.js';

test.describe('Photo upload flows', () => {
  test('Upload a single photo', async ({ uploadPage }) => {
    const filePath = path.resolve(process.cwd(), 'test-assets', 'photo-1.jpg');

    await uploadPage.navigateToUploadForm();
    await uploadPage.uploadFiles(filePath);
    await uploadPage.waitForUploadComplete();
    await uploadPage.navigateToReviewSection();
    await expect(uploadPage.page.locator('.is-photo')).toHaveCount(1, { timeout: 30000 });

    await uploadPage.approveAllPhotos();
    await expect(uploadPage.page.locator('.is-photo')).toHaveCount(0, { timeout: 30000 });

    await uploadPage.navigateToLibrary();
    await expect(uploadPage.page).toHaveURL(/\/library\/browse/);
    await expect(uploadPage.page.locator('.is-photo')).toHaveCount(1, { timeout: 30000 });
    await expect(uploadPage.page.locator('.is-photo[data-uid]')).toHaveCount(1);

    const photoUid = await uploadPage.page.locator('.is-photo[data-uid]').first().getAttribute('data-uid');
    const token = await uploadPage.page.evaluate(() => window.localStorage.getItem('session.token'));
    const response = await uploadPage.page.request.get(`/api/v1/photos?count=1&offset=0`, {
      headers: { 'X-Auth-Token': token! },
    });
    const photos = (await response.json()) as Array<{ UID: string; OriginalName: string }>;
    expect(photos[0].UID).toBe(photoUid);
    expect(photos[0].OriginalName).toContain('photo-1');

    await expect(uploadPage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.03 });
  });

  test('Upload multiple photos and approve them', async ({ uploadPage }) => {
    const filesPath = [
      path.resolve(process.cwd(), 'test-assets', 'photo-2.jpg'),
      path.resolve(process.cwd(), 'test-assets', 'photo-3.jpg'),
      path.resolve(process.cwd(), 'test-assets', 'photo-4.jpg'),
    ];

    await uploadPage.navigateToUploadForm();
    await expect(uploadPage.page.getByRole('button', { name: /browse/i })).toBeVisible();

    await uploadPage.uploadFiles(filesPath);
    await uploadPage.waitForUploadComplete();
    await uploadPage.navigateToReviewSection();
    await uploadPage.approveAllPhotos();
    await uploadPage.navigateToLibrary();
    await expect(uploadPage.page).toHaveURL(/\/library\/browse/);
    await expect(uploadPage.page.locator('.is-photo')).toHaveCount(3, { timeout: 30000 });

    const photoTiles = uploadPage.page.locator('.is-photo[data-uid]');
    await expect(photoTiles).toHaveCount(3);
    const uids = await photoTiles.evaluateAll((els: Element[]) =>
      els.map((el) => el.getAttribute('data-uid')),
    );
    const token = await uploadPage.page.evaluate(() => window.localStorage.getItem('session.token'));
    const response = await uploadPage.page.request.get(`/api/v1/photos?count=10&offset=0`, {
      headers: { 'X-Auth-Token': token! },
    });
    const photos = (await response.json()) as Array<{ UID: string; OriginalName: string }>;
    const originalNames = photos.map((p) => p.OriginalName);
    expect(originalNames.some((n) => n.includes('photo-2'))).toBe(true);
    expect(originalNames.some((n) => n.includes('photo-3'))).toBe(true);
    expect(originalNames.some((n) => n.includes('photo-4'))).toBe(true);
    expect(uids.every((uid) => photos.some((p) => p.UID === uid))).toBe(true);

    await expect(uploadPage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.03 });
  });
});
