import { Page, Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly photoTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.photoTile = page.locator('.is-photo');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/photos') && r.status() === 200, { timeout: 10000 }),
      this.page.keyboard.press('Enter'),
    ]).catch(() => {
      console.debug('SearchPage: URL did not change after search');
    });
  }

  async getResultCount(): Promise<number> {
    return this.photoTile.count();
  }
}
