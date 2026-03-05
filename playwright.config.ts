import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: `env/${process.env['NODE_ENV'] ? `${process.env['NODE_ENV']}.env` : `local.env`}`,
});

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
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
  },
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  projects: [
    {
      name: 'setup',
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: 'playwright/.auth/adminState.json',
      },
    },
    {
      name: 'user-setup',
      testMatch: /user\.setup\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'user-chromium',
      dependencies: ['user-setup'],
      // Exclude admin-only tests that require admin storageState and cause race conditions
      testIgnore: ['**/admin/**'],
      use: {
        browserName: 'chromium',
        storageState: 'playwright/.auth/userState.json',
      },
    },
  ],
});
