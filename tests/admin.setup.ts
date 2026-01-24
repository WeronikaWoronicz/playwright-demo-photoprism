import { test as setup } from '@playwright/test';
import { BASE_URL, photoprism } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';

const authFile = 'playwright/.auth/adminState.json';

setup('authenticate as admin', async ({ context, page }) => {
  await loginViaAPI(photoprism.username, photoprism.password, context);
  await page.goto(BASE_URL);
  await context.storageState({ path: authFile });
});
