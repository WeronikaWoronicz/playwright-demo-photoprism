import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: `env/${process.env['NODE_ENV'] ? `${process.env['NODE_ENV']}.env` : `local.env`}`,
});

const workers = parseInt(
  process.env['WORKER_COUNT'] ?? (process.env['PLAYWRIGHT_DOCKER_WORKERS'] === 'true' ? '4' : '1'),
  10
);
process.env['WORKER_COUNT'] = String(workers);

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  globalSetup: './lib/global-setup.ts',
  globalTeardown: './lib/global-teardown.ts',
  snapshotPathTemplate: 'test-assets/snapshots/{projectName}/{testFilePath}/{arg}{ext}',
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env['BASE_URL'],
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  timeout: 120 * 1000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.05,
    },
  },
  retries: process.env['CI'] ? 2 : 0,
  fullyParallel: true,
  workers,
  projects: [
    {
      name: 'setup',
      testMatch: /admin\.setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'cleanup',
      testMatch: /cleanup\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: `playwright/.auth/adminState-worker-0.json`,
      },
    },
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
      use: {
        storageState: `playwright/.auth/adminState-worker-0.json`,
      },
    },
    {
      name: 'chromium',
      dependencies: ['setup', 'cleanup'],
      use: {
        browserName: 'chromium',
        storageState: `playwright/.auth/adminState-worker-${process.env['TEST_PARALLEL_INDEX'] ?? '0'}.json`,
      },
    },
    {
      name: 'user-setup',
      testMatch: /user\.setup\.ts/,
      dependencies: ['setup', 'cleanup'],
    },
    {
      name: 'user-chromium',
      dependencies: ['user-setup'],
      testIgnore: ['**/admin/**'],
      use: {
        browserName: 'chromium',
        storageState: `playwright/.auth/userState-worker-${process.env['TEST_PARALLEL_INDEX'] ?? '0'}.json`,
      },
    },
  ],
});
