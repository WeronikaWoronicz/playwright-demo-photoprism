import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

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
