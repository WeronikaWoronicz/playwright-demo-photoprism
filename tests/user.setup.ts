import { test as setup } from '@playwright/test';
import { BASE_URL, photoprism } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';

const authFile = 'playwright/.auth/userState.json';

const username = process.env['PHOTOPRISM_USER_USERNAME'] || 'testuser';
const password = process.env['PHOTOPRISM_USER_PASSWORD'] || 'testuser123!';

setup('create user and authenticate', async ({ context, page }) => {
  await loginViaAPI(photoprism.username, photoprism.password, context);
  await page.goto(BASE_URL);

  const adminToken = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const tokenKey = keys.find((k) => k.endsWith('session.token'));
    return tokenKey ? localStorage.getItem(tokenKey) : null;
  });

  if (!adminToken) throw new Error('Could not obtain admin session token');

  const createUserResponse = await context.request.post(`${BASE_URL}/api/v1/users`, {
    headers: { 'X-Auth-Token': adminToken },
    data: { Name: username, Password: password, Role: 'user' },
  });

  if (createUserResponse.status() === 404) {
    await context.storageState({ path: authFile });
    return;
  }

  if (createUserResponse.status() !== 201 && createUserResponse.status() !== 409) {
    throw new Error(`Unexpected response from user creation API: ${createUserResponse.status()}`);
  }

  const userContext = await context.browser()!.newContext();
  await loginViaAPI(username, password, userContext);
  const userPage = await userContext.newPage();
  await userPage.goto(BASE_URL);
  await userContext.storageState({ path: authFile });
  await userContext.close();
});
