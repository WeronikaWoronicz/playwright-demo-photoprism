import { test } from '../../../fixtures/pages.js';
import { expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  test('TC-RBAC-001 User can access settings page as admin @P0', async ({ adminPage, page }) => {
    await adminPage.navigateToSettings();
    await expect(page).toHaveURL(/\/library\/settings/);
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
  });

  test('TC-RBAC-002 User can access maintenance page as admin @P0', async ({ adminPage, page }) => {
    await adminPage.navigateToMaintenance();
    await expect(page).toHaveURL(/\/library\/maintenance/);
    await expect(page.getByRole('heading', { name: /maintenance/i })).toBeVisible();
  });
});
