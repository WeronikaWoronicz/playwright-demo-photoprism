import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';
import { getUserAuthPath } from '../../../lib/auth-paths.js';

test.describe('Role-Based Access Control', () => {
  test('TC-RBAC-001 User can access settings page as admin @P0', async ({ adminPage, page }) => {
    await adminPage.navigateToSettings();
    const denied = await adminPage.isAccessDenied();
    expect(denied).toBe(false);
    const visible = await adminPage.isSettingsVisible();
    expect(visible).toBe(true);
    await expect(page.getByText('General')).toBeVisible();
  });

  test('TC-RBAC-002 User can access maintenance page as admin @P0', async ({ adminPage, page }) => {
    await adminPage.navigateToMaintenance();
    const denied = await adminPage.isAccessDenied();
    expect(denied).toBe(false);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('RBAC — Regular User', () => {
  test.use({ storageState: getUserAuthPath(process.env['TEST_PARALLEL_INDEX'] ?? '0') });

  test('TC-RBAC-003 User sees expected settings access as regular user @P0', async ({ adminPage }) => {
    await adminPage.navigateToSettings();
    const settingsVisible = await adminPage.isSettingsVisible();
    const denied = await adminPage.isAccessDenied();
    expect(denied).not.toBe(settingsVisible);
  });
});
