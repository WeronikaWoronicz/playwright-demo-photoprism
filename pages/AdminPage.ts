import { Page, Locator } from '@playwright/test';
import { BASE_URL } from '../config.js';

export class AdminPage {
  readonly page: Page;
  readonly signInButton: Locator;
  readonly generalTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.generalTab = page.getByRole('tab', { name: 'General' });
  }

  async navigateToSettings() {
    await this.page.goto(BASE_URL + '/library/settings');
  }

  async isAccessDenied(): Promise<boolean> {
    const url = this.page.url();
    const urlDenied = url.includes('login') || url.includes('403');
    const loginFormVisible = await this.signInButton.isVisible();
    return urlDenied || loginFormVisible;
  }

  async isSettingsVisible(): Promise<boolean> {
    try {
      await this.generalTab.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
