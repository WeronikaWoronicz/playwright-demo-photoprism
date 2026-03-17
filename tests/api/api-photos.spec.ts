import { test } from '../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { BASE_URL } from '../../config.js';

test.describe('API Photo Endpoints', () => {
  test('TC-API-001 User can retrieve photos via GET /api/v1/photos @P0', async ({ page, uploadedPhoto: _ }) => {
    await page.goto(BASE_URL);
    const token = await page.evaluate(() => localStorage.getItem('session.token'));

    const resp = await page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10 },
      headers: { 'X-Auth-Token': token! },
    });

    expect(resp.status()).toBe(200);
    const data = (await resp.json()) as Array<{ UID: string; Title: string; OriginalName: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('UID');
    expect(data[0]).toHaveProperty('Title');
    expect(data[0]).toHaveProperty('OriginalName');
  });
});
