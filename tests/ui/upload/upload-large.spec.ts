import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { createPath } from '../../../lib/assets.js';

test.describe('Upload network failure', () => {
  test('TC-UPL-005 User sees error state when network aborts during upload @P1', async ({
    uploadPage,
    page,
    a11yCheck,
  }) => {
    await page.route('**/api/v1/upload/**', (route) => route.abort('connectionfailed'));

    const photoFile = createPath('test-assets', 'upload-large', 'large-network-abort.jpg');
    await uploadPage.navigateToUploadForm();
    await a11yCheck();

    await uploadPage.uploadFiles(photoFile).catch(() => {});

    await expect(page.getByRole('button', { name: /browse/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /browse/i })).toHaveScreenshot('upload-dialog-network-abort.png');

    await page.unroute('**/api/v1/upload/**');

    expect(uploadPage.trackedUids.length).toBe(0);
  });
});
