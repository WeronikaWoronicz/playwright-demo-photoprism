import { test as setup } from '@playwright/test';
import { photoprism, getWorkerBaseUrl } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getAdminAuthPath } from '../lib/auth-paths.js';
import { mkdirSync } from 'fs';

setup('authenticate as admin', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '4', 10);
  for (let i = 0; i < workerCount; i++) {
    const baseUrl = getWorkerBaseUrl(i);
    const context = await browser.newContext();
    await loginViaAPI(photoprism.username, photoprism.password, context, baseUrl);
    const page = await context.newPage();
    await page.goto(baseUrl);
    await context.storageState({ path: getAdminAuthPath(i) });
    await context.close();
  }
});
