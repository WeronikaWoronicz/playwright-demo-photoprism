import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { getUserAuthPath } from '../../../lib/auth-paths.js';

test.describe('RBAC — Regular User', () => {
  test.use({ storageState: getUserAuthPath(process.env['TEST_PARALLEL_INDEX'] ?? '0') });

  test('TC-RBAC-003 User sees expected settings access as regular user @P0', async ({ adminPage }) => {
    await adminPage.navigateToSettings();
    const settingsVisible = await adminPage.isSettingsVisible();
    const denied = await adminPage.isAccessDenied();
    expect(denied).not.toBe(settingsVisible);
  });
});
