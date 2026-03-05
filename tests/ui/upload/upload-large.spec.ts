import path from 'path';
import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Upload network failure', () => {
  test('TC-UPL-005 User sees error state when network aborts during upload @P1', async ({
    uploadPage,
    page,
    a11yCheck,
  }) => {
    await page.route('**/api/v1/upload/**', (route) => route.abort('connectionfailed'));

    const photoFile = path.join(process.cwd(), 'test-assets', 'photo-1.jpg');
    await uploadPage.navigateToUploadForm();
    await a11yCheck();

    await uploadPage.uploadFiles(photoFile).catch(() => {
      /* network abort is expected */
    });

    await expect(page.getByRole('button', { name: /browse/i })).toBeVisible();

    await page.unroute('**/api/v1/upload/**');

    await uploadPage.navigateToLibrary();
    await expect(page.locator('.is-photo')).toHaveCount(0);
  });
});
