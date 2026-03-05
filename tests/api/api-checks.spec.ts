import { test } from '../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../config.js';

test.describe('API Endpoint Checks', () => {
  test('TC-API-001 User can retrieve photos via GET /api/v1/photos @P0', async ({ page }) => {
    await page.goto(BASE_URL);
    const token = await page.evaluate(() => localStorage.getItem('session.token'));

    const resp = await page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10 },
      headers: { 'X-Auth-Token': token! },
    });

    expect(resp.status()).toBe(200);
    const data = (await resp.json()) as Array<{ UID: string; Title: string; OriginalName: string }>;
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      expect(data[0]).toHaveProperty('UID');
      expect(data[0]).toHaveProperty('Title');
      expect(data[0]).toHaveProperty('OriginalName');
    }
  });

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
