import { type Page, type Locator } from '@playwright/test';
import { BASE_URL } from '../config.js';

const selectors = {
  photo: {
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
    tileByUid: (uid: string) => `.is-photo[data-uid="${uid}"]`,
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

  async navigateToArchive() {
    await this.page.goto(BASE_URL + '/library/archive');
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

  getPhotoTile(uid: string): Locator {
    return this.page.locator(selectors.photo.tileByUid(uid));
  }

  async selectPhoto(uid: string): Promise<void> {
    const tile = this.getPhotoTile(uid);
    await tile.waitFor({ timeout: 15000 });
    await tile.locator('.input-select').click();
    await this.page.getByRole('button', { name: /photo actions/i }).waitFor({ timeout: 15000 });
  }

  async clickPhoto(uid: string) {
    await this.getPhotoTile(uid).click();
  }

  async waitForPhoto(uid: string, timeout = 15000) {
    await this.getPhotoTile(uid).waitFor({ state: 'visible', timeout });
  }

  async waitForPhotoDisappearing(uid: string, timeout = 10000) {
    await this.getPhotoTile(uid).waitFor({ state: 'hidden', timeout });
  }
}
