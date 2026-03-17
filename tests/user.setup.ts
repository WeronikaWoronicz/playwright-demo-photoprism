import { test as setup } from '@playwright/test';
import { photoprism } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getUserAuthPath } from '../lib/auth-paths.js';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const username = process.env['PHOTOPRISM_USER_USERNAME'] || 'testuser';
const password = process.env['PHOTOPRISM_USER_PASSWORD'] || 'testuser123!';

function getWorkerBaseUrl(workerIndex: number): string {
  const portMapPath = join(process.cwd(), '.worker-ports.json');
  if (existsSync(portMapPath)) {
    const portMap = JSON.parse(readFileSync(portMapPath, 'utf-8')) as Record<string, number>;
    const port = portMap[String(workerIndex)];
    if (port) return `http://127.0.0.1:${port}`;
  }
  return process.env['BASE_URL'] ?? 'http://127.0.0.1:2342';
}

setup('create user and authenticate', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '1', 10);
  for (let i = 0; i < workerCount; i++) {
    const baseUrl = getWorkerBaseUrl(i);
    const adminContext = await browser.newContext();
    await loginViaAPI(photoprism.username, photoprism.password, adminContext, baseUrl);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(baseUrl);

    const adminToken = await adminPage.evaluate(() => {
      const keys = Object.keys(localStorage);
      const tokenKey = keys.find((k) => k.endsWith('session.token'));
      return tokenKey ? localStorage.getItem(tokenKey) : null;
    });

    if (!adminToken) throw new Error('Could not obtain admin session token');

    const createUserResponse = await adminContext.request.post(`${baseUrl}/api/v1/users`, {
      headers: { 'X-Auth-Token': adminToken },
      data: { Name: username, Password: password, Role: 'user' },
    });

    if (createUserResponse.status() === 404) {
      await adminContext.storageState({ path: getUserAuthPath(i) });
      await adminContext.close();
      continue;
    }

    if (createUserResponse.status() !== 201 && createUserResponse.status() !== 409) {
      throw new Error(`Unexpected response from user creation API: ${createUserResponse.status()}`);
    }

    const userContext = await browser.newContext();
    await loginViaAPI(username, password, userContext, baseUrl);
    const userPage = await userContext.newPage();
    await userPage.goto(baseUrl);
    await userContext.storageState({ path: getUserAuthPath(i) });
    await userContext.close();
    await adminContext.close();
  }
});
