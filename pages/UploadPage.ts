import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { uploadMessages } from '../lib/constants.js';

const selectors = {
  nav: {
    uploadLink: 'a.nav-upload',
    searchInput: 'Search',
  },
  upload: {
    browseButton: /browse/i,
    completeText: uploadMessages.uploadCompleted,
  },
  photo: {
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
    selectButton: '.is-photo button.input-select',
  },
};

export class UploadPage {
  private _trackedUids: string[] = [];
  private _preUploadUids: Set<string> = new Set();

  constructor(readonly page: Page) {}

  get trackedUids(): string[] {
    return [...this._trackedUids];
  }

  private async getSessionToken(): Promise<string | undefined> {
    const state = await this.page.context().storageState();
    return state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;
  }

  private async fetchPhotoUids(params: Record<string, unknown> = {}): Promise<string[]> {
    const token = await this.getSessionToken();
    if (!token) return [];
    const resp = await this.page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10000, offset: 0, ...params },
      headers: { 'X-Auth-Token': token },
    });
    if (!resp.ok()) return [];
    const photos = (await resp.json()) as Array<{ UID: string }>;
    return photos.map((p) => p.UID);
  }

  private async capturePreUploadState(): Promise<void> {
    const [libraryUids, reviewUids] = await Promise.all([this.fetchPhotoUids(), this.fetchPhotoUids({ review: true })]);
    this._preUploadUids = new Set([...libraryUids, ...reviewUids]);
  }

  private async approveOwnReviewPhotos(): Promise<void> {
    const reviewUids = await this.fetchPhotoUids({ review: true });
    const ownReviewUids = reviewUids.filter((uid) => !this._preUploadUids.has(uid));
    if (ownReviewUids.length === 0) return;
    const token = await this.getSessionToken();
    if (!token) return;
    await this.page.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
      data: { photos: ownReviewUids },
      headers: { 'X-Auth-Token': token },
    });
  }

  async navigateToUploadForm() {
    await this.page.goto(BASE_URL + '/library/browse');
    await this.capturePreUploadState();
    const uploadLink = this.page.locator(selectors.nav.uploadLink);
    const isAttached = await uploadLink
      .waitFor({ state: 'attached', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!isAttached) {
      await this.page.getByRole('button', { name: /open menu/i }).click();
      await uploadLink.waitFor({ state: 'attached', timeout: 10000 });
    }
    await this.openUploadMenu();
  }

  private async openUploadMenu() {
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
    await this.page
      .waitForResponse((resp) => resp.url().includes('/upload/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      })
      .catch(() => {});
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
    await this.approveOwnReviewPhotos();
    await this.page.goto(`${BASE_URL}/library/browse`);
    await this.page.locator(selectors.photo.renderedTile).first().waitFor({ timeout: 30000 });
    const rendered = await this.getRenderedPhotoUids();
    const newUids = rendered.filter((uid) => !this._preUploadUids.has(uid));
    this._trackedUids = [...new Set([...this._trackedUids, ...newUids])];
  }

  private async getLibraryPhotoCount(): Promise<number> {
    const token = await this.getSessionToken();
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
    const token = await this.getSessionToken();
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
