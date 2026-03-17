import { test as setup } from '@playwright/test';
import { getWorkerBaseUrl } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getUserAuthPath } from '../lib/auth-paths.js';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';

const username = process.env['PHOTOPRISM_USER_USERNAME'] || 'testuser';
const password = process.env['PHOTOPRISM_USER_PASSWORD'] || 'testuser123!';

setup('create user and authenticate', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '4', 10);
  const useDockerWorkers = process.env['PLAYWRIGHT_DOCKER_WORKERS'] === 'true';
  for (let i = 0; i < workerCount; i++) {
    const baseUrl = getWorkerBaseUrl(i);
    if (useDockerWorkers) {
      const containerName = `pw-worker-${i}-photoprism-1`;
      try {
        execSync(`docker exec ${containerName} photoprism users add -r user -p "${password}" "${username}"`, {
          stdio: 'pipe',
        });
      } catch {}
    }
    const userContext = await browser.newContext();
    try {
      await loginViaAPI(username, password, userContext, baseUrl);
      const userPage = await userContext.newPage();
      await userPage.goto(baseUrl);
      await userContext.storageState({ path: getUserAuthPath(i) });
    } finally {
      await userContext.close();
    }
  }
});
