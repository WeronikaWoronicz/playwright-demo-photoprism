import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { randomBytes } from 'crypto';

const selectors = {
  albums: {
    path: '/library/albums',
    card: 'div.result.is-album',
    titleButton: 'button.action-title-edit',
  },
  toolbar: {
    addButton: 'button.action-add[title="Add Album"]',
  },
  editDialog: {
    titleInput: '.input-title input',
    confirmButton: 'button.action-confirm',
  },
};

export class AlbumPage {
  private _uniqueTag: string;
  private _trackedAlbumUids: string[] = [];

  constructor(readonly page: Page) {
    this._uniqueTag = randomBytes(4).toString('hex');
  }

  uniqueName(base: string): string {
    return `${base} ${this._uniqueTag}`;
  }

  async navigateToAlbums() {
    await this.page.goto(BASE_URL + selectors.albums.path);
    await this.page.locator(selectors.toolbar.addButton).waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickAddAlbum() {
    await this.page.locator(selectors.toolbar.addButton).click();
    await this.page.locator(selectors.albums.card).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async typeAlbumName(name: string) {
    await this.page.locator(selectors.albums.titleButton).first().click();
    await this.page.locator(selectors.editDialog.titleInput).fill(name);
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
    const uid = body.UID as string;
    this._trackedAlbumUids.push(uid);
    return uid;
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

  async deleteTrackedAlbums(): Promise<void> {
    const token = await this.getAuthToken().catch(() => null);
    if (!token || this._trackedAlbumUids.length === 0) return;
    for (const uid of this._trackedAlbumUids) {
      await this.page.request
        .delete(`${BASE_URL}/api/v1/albums/${uid}`, {
          headers: { 'X-Auth-Token': token },
        })
        .catch(() => {});
    }
    this._trackedAlbumUids = [];
  }
}
