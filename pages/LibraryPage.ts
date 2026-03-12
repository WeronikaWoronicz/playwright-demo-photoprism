import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

const selectors = {
  photo: {
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
  },
  search: {
    input: 'Search',
  },
};

export class LibraryPage {
  constructor(readonly page: Page) {}

  async navigateToBrowse() {
    await this.page.goto(BASE_URL + '/library/browse');
    await this.page.getByRole('textbox', { name: selectors.search.input }).waitFor();
  }

  async getPhotoCount(): Promise<number> {
    return this.page.locator(selectors.photo.tile).count();
  }

  async getRenderedPhotoUids(): Promise<string[]> {
    return this.page
      .locator(selectors.photo.renderedTile)
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-uid') as string));
  }

  async setSortOrder(order: 'newest' | 'oldest') {
    await this.page.goto(BASE_URL + '/library/browse?order=' + order);
    await this.waitForPhotos();
  }

  async waitForPhotos() {
    await this.page.locator(selectors.photo.renderedTile).first().waitFor({ timeout: 15000 });
  }

  async selectFirstPhoto(): Promise<void> {
    await this.page.locator(selectors.photo.renderedTile).first().waitFor({ timeout: 15000 });
    await this.page.evaluate(() => {
      const uid = document.querySelector('.is-photo[data-uid]')?.getAttribute('data-uid');
      if (!uid) throw new Error('No photo tile with data-uid found');
      const appEl = document.querySelector('#app') as HTMLElement & {
        __vue_app__: { config: { globalProperties: { $clipboard: { toggle(m: { getId(): string }): boolean } } } };
      };
      appEl.__vue_app__.config.globalProperties.$clipboard.toggle({ getId: () => uid });
    });
    await this.page.locator('.clipboard-container .action-menu').waitFor({ timeout: 15000 });
  }

  async selectPhoto(uid: string): Promise<void> {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).waitFor({ timeout: 15000 });
    await this.page.evaluate((targetUid: string) => {
      const appEl = document.querySelector('#app') as HTMLElement & {
        __vue_app__: { config: { globalProperties: { $clipboard: { toggle(m: { getId(): string }): boolean } } } };
      };
      appEl.__vue_app__.config.globalProperties.$clipboard.toggle({ getId: () => targetUid });
    }, uid);
    await this.page.locator('.clipboard-container .action-menu').waitFor({ timeout: 15000 });
  }

  async clickPhoto(uid: string) {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).click();
  }

  async waitForPhoto(uid: string, timeout = 15000) {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).waitFor({ state: 'visible', timeout });
  }

  async waitForPhotoDisappearing(uid: string, timeout = 10000) {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).waitFor({ state: 'hidden', timeout });
  }
}
