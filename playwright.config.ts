import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: `env/${process.env.NODE_ENV ? `${process.env.NODE_ENV}.env` : `local.env`}`,
});

export default defineConfig({
  testDir: '.',
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env['BASE_URL'],
    actionTimeout: 0,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  timeout: 50 * 1000,
  expect: {
    timeout: 10000,
  },
  retries: 2,
  workers: 4,
  projects: [
    {
      name: 'admin',
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['admin'],
      use: {
        storageState: 'playwright/.auth/adminState.json',
      },
    },
  ],
});
