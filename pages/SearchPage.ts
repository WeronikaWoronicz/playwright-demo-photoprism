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
  }

  async getResultCount(): Promise<number> {
    return this.page.locator(selectors.search.tile).count();
  }

  async getResultTitles(): Promise<string[]> {
    return this.page
      .locator(selectors.search.tile)
      .evaluateAll((els) => els.map((el) => el.getAttribute('title') ?? el.textContent ?? ''));
  }

  async clearSearch() {
    await this.page.getByRole('textbox', { name: selectors.search.input }).clear();
  }

  async waitForResults() {
    await this.page.locator(selectors.search.tile).first().waitFor({ timeout: 10000 });
  }
}
