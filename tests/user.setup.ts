import { test as setup } from '@playwright/test';
import { photoprism, getWorkerBaseUrl } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getUserAuthPath } from '../lib/auth-paths.js';
import { mkdirSync } from 'fs';

const username = process.env['PHOTOPRISM_USER_USERNAME'] || 'testuser';
const password = process.env['PHOTOPRISM_USER_PASSWORD'] || 'testuser123!';

setup('create user and authenticate', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '4', 10);
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
