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
    await this.page.keyboard.press('Enter');
    await this.page
      .waitForURL((url) => url.searchParams.get('q') === query || url.hash.includes(encodeURIComponent(query)), {
        timeout: 5000,
      })
      .catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async getResultCount(): Promise<number> {
    return this.page.locator(selectors.search.tile).count();
  }
}
