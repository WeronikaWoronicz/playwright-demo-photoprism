import { test as setup } from '@playwright/test';
import { getWorkerBaseUrl } from '../config.js';
import { loginViaAPI } from '../lib/auth.js';
import { getUserAuthPath } from '../lib/auth-paths.js';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const username = process.env['PHOTOPRISM_USER_USERNAME'] || 'testuser';
const password = process.env['PHOTOPRISM_USER_PASSWORD'] || 'testuser123!';
const sutDir = join(process.cwd(), 'sut');
const useDockerWorkers = process.env['PLAYWRIGHT_DOCKER_WORKERS'] === 'true';
const composeFile = join(sutDir, useDockerWorkers ? 'compose.worker.yml' : 'compose.yml');

setup('create user and authenticate', async ({ browser }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  const workerCount = parseInt(process.env['WORKER_COUNT'] ?? '1', 10);
  for (let i = 0; i < workerCount; i++) {
    const baseUrl = getWorkerBaseUrl(i);
    const projectFlag = useDockerWorkers ? `-p pw-worker-${i}` : '';
    try {
      execSync(
        `docker compose -f "${composeFile}" ${projectFlag} exec -T photoprism photoprism users add -r user -p "${password}" "${username}"`,
        { stdio: 'pipe' }
      );
    } catch {}
    const userContext = await browser.newContext();
    try {
      await loginViaAPI(username, password, userContext, baseUrl);
      const userPage = await userContext.newPage();
      await userPage.goto(baseUrl);
      const token = await userPage.evaluate(() => localStorage.getItem('session.token'));
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error(
          `User "${username}" login failed on ${baseUrl}. Create the user first:\n` +
            `  docker compose -f sut/compose.yml exec photoprism photoprism users add -r user -p "${password}" "${username}"`
        );
      }
      await userContext.storageState({ path: getUserAuthPath(i) });
    } finally {
      await userContext.close();
    }
  }
});
