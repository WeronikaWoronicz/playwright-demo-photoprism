import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

const selectors = {
  albums: {
    path: '/library/albums',
    // PhotoPrism album cards are Vue components — CSS class is the only stable hook.
    card: 'div.result.is-album',
    // Title button inside album card — no accessible role/label; CSS class selector required.
    titleButton: 'button.action-title-edit',
  },
  toolbar: {
    // Vue toolbar "+" button — no accessible role/label; CSS class is the only stable hook.
    addButton: 'button.action-add[title="Add Album"]',
  },
  editDialog: {
    // Album edit dialog title input — Vue component with no accessible label; CSS class required.
    titleInput: '.input-title input',
    confirmButton: 'button.action-confirm',
  },
};

export class AlbumPage {
  constructor(readonly page: Page) {}

  async navigateToAlbums() {
    await this.page.goto(BASE_URL + selectors.albums.path);
    await this.page.locator(selectors.toolbar.addButton).waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickAddAlbum() {
    await this.page.locator(selectors.toolbar.addButton).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(selectors.toolbar.addButton).click();
    await this.page.getByText('Album created').waitFor({ timeout: 10000 });
  }

  async typeAlbumName(name: string) {
    await this.page.locator(selectors.albums.titleButton).first().click();
    const input = this.page.locator(selectors.editDialog.titleInput);
    await input.waitFor({ timeout: 5000 });
    await input.fill(name);
  }

  async confirmCreate() {
    await this.page.locator(selectors.editDialog.confirmButton).click();
  }

  async getAlbumTitles(): Promise<string[]> {
    const titles = this.page.locator(`${selectors.albums.card} ${selectors.albums.titleButton}`);
    return titles.allTextContents();
  }

  async isAlbumVisible(name: string): Promise<boolean> {
    const titles = await this.getAlbumTitles();
    return titles.some((t) => t.trim() === name);
  }

  async getAlbumCount(): Promise<number> {
    return this.page.locator(selectors.albums.card).count();
  }

  async openAlbum(name: string) {
    await this.page.locator(selectors.albums.card, { hasText: name }).locator('.preview').first().click();
  }

  async getAuthToken(): Promise<string> {
    const state = await this.page.context().storageState();
    const token = state.origins
      .flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name === 'session.token')?.value;
    if (!token) throw new Error('No auth token found in storageState');
    return token;
  }

  async createAlbumViaAPI(name: string): Promise<string> {
    const resp = await this.page.request.post(`${BASE_URL}/api/v1/albums`, {
      headers: { 'X-Auth-Token': await this.getAuthToken() },
      data: { Title: name },
    });
    const body = await resp.json();
    return body.UID as string;
  }

  async addPhotosToAlbumViaAPI(albumUid: string, photoUids: string[]): Promise<void> {
    await this.page.request.post(`${BASE_URL}/api/v1/albums/${albumUid}/photos`, {
      headers: { 'X-Auth-Token': await this.getAuthToken() },
      data: { photos: photoUids },
    });
  }

  async getAlbumPhotosViaAPI(albumUid: string): Promise<Array<{ UID: string }>> {
    const resp = await this.page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 1000, album: albumUid },
      headers: { 'X-Auth-Token': await this.getAuthToken() },
    });
    return resp.json();
  }

  async deleteAlbumViaAPI(albumUid: string): Promise<void> {
    await this.page.request.delete(`${BASE_URL}/api/v1/albums/${albumUid}`, {
      headers: { 'X-Auth-Token': await this.getAuthToken() },
    });
  }
}
