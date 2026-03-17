import { test as setup } from '@playwright/test';
import { photoprism } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getAdminAuthPath } from '../lib/auth-paths.js';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function getWorkerBaseUrl(workerIndex: number): string {
  const portMapPath = join(process.cwd(), '.worker-ports.json');
  if (existsSync(portMapPath)) {
    const portMap = JSON.parse(readFileSync(portMapPath, 'utf-8')) as Record<string, number>;
    const port = portMap[String(workerIndex)];
    if (port) return `http://127.0.0.1:${port}`;
  }
  return process.env['BASE_URL'] ?? 'http://127.0.0.1:2342';
}

setup('authenticate as admin', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '1', 10);
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
