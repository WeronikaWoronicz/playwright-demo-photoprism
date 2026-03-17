import { type Page } from '@playwright/test';

const selectors = {
  search: {
    input: 'Search',
    tile: '.is-photo',
  },
};

export class SearchPage {
  constructor(readonly page: Page) {}

  async search(query: string) {
    await this.page.getByRole('textbox', { name: selectors.search.input }).fill(query);
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/photos') && r.status() === 200, { timeout: 10000 }),
      this.page.keyboard.press('Enter'),
    ]).catch(() => {
      console.debug('SearchPage: URL did not change after search');
    });
  }

  async getResultCount(): Promise<number> {
    return this.page.locator(selectors.search.tile).count();
  }
}
