import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
    path: `env/${process.env.NODE_ENV ? `${process.env.NODE_ENV}.env` : `local.env`}`
});

export default defineConfig({
    testDir: '.',
    use: {
        actionTimeout: 0,
        navigationTimeout: 30000,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: null,
    },
    timeout: 50 * 1000,
    expect: {
        timeout: 10000
    },
    retries: 2,
    workers: 4,
});
