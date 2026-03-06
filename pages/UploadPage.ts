import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { uploadMessages } from '../lib/constants.js';
import { approveAllReviewPhotos } from '../lib/photoprism-api.js';

const selectors = {
  nav: {
    // No accessible role/label — CSS class is the only stable hook.
    uploadLink: 'a.nav-upload',
    searchInput: 'Search',
  },
  upload: {
    browseButton: /browse/i,
    completeText: uploadMessages.uploadCompleted,
  },
  photo: {
    // Vue components with no accessible role/label — CSS selectors required.
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
    selectButton: '.is-photo button.input-select',
  },
};

export class UploadPage {
  constructor(readonly page: Page) {}

  async navigateToUploadForm() {
    await this.page.goto(BASE_URL + '/library/browse');
    await this.page.locator(selectors.nav.uploadLink).waitFor({ state: 'attached', timeout: 10000 });
    await this.openUploadMenu();
  }

  private async openUploadMenu() {
    // JS click bypasses visibility — upload link is hidden in sidebar rail mode.
    await this.page.evaluate(() => {
      const link = document.querySelector('a.nav-upload') as HTMLElement | null;
      if (!link) throw new Error('Upload link not found in navigation');
      link.click();
    });
    await this.page.getByRole('button', { name: selectors.upload.browseButton }).waitFor({ timeout: 10000 });
  }

  async uploadFiles(filePaths: string | string[]) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: selectors.upload.browseButton }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(filePaths);
  }

  async waitForUploadComplete() {
    await this.page.getByText(selectors.upload.completeText).waitFor({ timeout: 30000 });
    // Wait for the PUT import request — navigating away before it completes can abort the import.
    await this.page
      .waitForResponse((resp) => resp.url().includes('/upload/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      })
      .catch(() => {
        // PUT may have already completed before this listener was registered.
      });
  }

  async waitForPhotoInLibrary(_minCount = 1) {
    const { expect } = await import('@playwright/test');
    await expect
      .poll(
        async () => {
          return (await this.getReviewPhotoCount()) + (await this.getLibraryPhotoCount());
        },
        { timeout: 60000 }
      )
      .toBeGreaterThanOrEqual(1);
    await approveAllReviewPhotos(this.page);
    await this.page.goto(`${BASE_URL}/library/browse`);
    await this.page.locator(selectors.photo.renderedTile).first().waitFor({ timeout: 30000 });
  }

  private async getLibraryPhotoCount(): Promise<number> {
    const state = await this.page.context().storageState();
    const token = state.origins
      .flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name === 'session.token')?.value;
    if (!token) return 0;
    const resp = await this.page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 1, offset: 0 },
      headers: { 'X-Auth-Token': token },
    });
    if (!resp.ok()) return 0;
    const photos = (await resp.json()) as Array<unknown>;
    return photos.length;
  }

  private async getReviewPhotoCount(): Promise<number> {
    const state = await this.page.context().storageState();
    const token = state.origins
      .flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name === 'session.token')?.value;
    if (!token) return 0;
    const resp = await this.page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 1, offset: 0, review: true },
      headers: { 'X-Auth-Token': token },
    });
    if (!resp.ok()) return 0;
    const photos = (await resp.json()) as Array<unknown>;
    return photos.length;
  }

  async navigateToLibrary() {
    await this.page.goto(`${BASE_URL}/library/browse`);
    await this.page.getByRole('textbox', { name: selectors.nav.searchInput }).waitFor();
  }

  async getRenderedPhotoUids(): Promise<string[]> {
    const tiles = this.page.locator(selectors.photo.renderedTile);
    return tiles.evaluateAll((els: Element[]) => els.map((el) => el.getAttribute('data-uid') as string));
  }
}
