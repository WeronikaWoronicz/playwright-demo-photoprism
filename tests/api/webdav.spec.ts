import { test } from '../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL, photoprism } from '../../config.js';

test.describe('WebDAV Access', () => {
  test('TC-API-006 User can list files via WebDAV PROPFIND @P3', async ({ page }) => {
    const credentials = Buffer.from(`${photoprism.username}:${photoprism.password}`).toString('base64');

    const resp = await page.request.fetch(`${BASE_URL}/originals/`, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${credentials}`,
        Depth: '1',
      },
    });

    expect([200, 207]).toContain(resp.status());
  });
});
