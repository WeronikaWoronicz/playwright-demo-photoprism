import { test } from '../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../config.js';

test.describe('API Endpoint Checks', () => {
  test('TC-API-003 User sees server status from GET /api/v1/status @P1', async ({ page }) => {
    await page.goto(BASE_URL);
    const resp = await page.request.get(`${BASE_URL}/api/v1/status`);
    expect(resp.status()).toBe(200);
  });

  test('TC-API-004 User sees 401 or 403 when accessing photos API without auth @P0', async ({ browser }) => {
    const unauthCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const unauthPage = await unauthCtx.newPage();

    const resp = await unauthPage.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10 },
    });

    expect([401, 403]).toContain(resp.status());
    await unauthCtx.close();
  });
});
