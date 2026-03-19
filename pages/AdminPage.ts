import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

const selectors = {
  settings: {
    path: '/library/settings',
  },
  admin: {
    path: '/admin',
  },
};

export class AdminPage {
  constructor(readonly page: Page) {}

  async navigateToSettings() {
    await this.page.goto(BASE_URL + selectors.settings.path);
  }

  async isAccessDenied(): Promise<boolean> {
    const url = this.page.url();
    const urlDenied = url.includes('login') || url.includes('403');
    const loginFormVisible = await this.page.getByRole('button', { name: 'Sign in' }).isVisible();
    return urlDenied || loginFormVisible;
  }

  async isSettingsVisible(): Promise<boolean> {
    try {
      await this.page.getByRole('tab', { name: 'General' }).waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
