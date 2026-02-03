import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: `env/${process.env.NODE_ENV ? `${process.env.NODE_ENV}.env` : `local.env`}`,
});

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env['BASE_URL'],
    actionTimeout: 0,
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  timeout: 50 * 1000,
  expect: {
    timeout: 10000,
  },
  retries: 2,
  workers: process.env['CI'] ? 1 : 4,
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: 'playwright/.auth/adminState.json',
      },
    },
  ],
});
