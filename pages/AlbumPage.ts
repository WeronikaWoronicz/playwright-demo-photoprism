import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { randomBytes } from 'crypto';
import { createAlbum, addPhotosToAlbum, getAlbumPhotos, deleteAlbum } from '../lib/photoprism-api.js';

const ALBUMS_PATH = '/library/albums';

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
    await this.page.goto(BASE_URL + ALBUMS_PATH);
    await this.page.locator('.p-page__content').waitFor({ state: 'visible', timeout: 15000 });
    await this.page.getByTitle('Add Album').waitFor({ state: 'visible', timeout: 5000 });
  }

  async clickAddAlbum() {
    const albumCreated = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/albums') && resp.request().method() === 'POST'
    );
    await this.page.getByTitle('Add Album').click();
    await albumCreated;
    await this.page.reload();
    await this.page.locator('.p-page__content').waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator('.action-title-edit').first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async typeAlbumName(name: string) {
    await this.page.locator('.action-title-edit').first().click();
    await this.page.locator('.input-title input').fill(name);
  }

  async confirmCreate() {
    await this.page.locator('.action-confirm').click();
  }

  async getAlbumTitles(): Promise<string[]> {
    const titles = this.page.locator('.result.not-selectable .action-title-edit');
    return titles.allTextContents();
  }

  async isAlbumVisible(name: string): Promise<boolean> {
    const titles = await this.getAlbumTitles();
    return titles.some((t) => t.trim() === name);
  }

  async getAlbumCount(): Promise<number> {
    return this.page.locator('.result.not-selectable').count();
  }

  async createAlbumViaAPI(name: string): Promise<string> {
    const uid = await createAlbum(this.page, name);
    this._trackedAlbumUids.push(uid);
    return uid;
  }

  async addPhotosToAlbumViaAPI(albumUid: string, photoUids: string[]): Promise<void> {
    await addPhotosToAlbum(this.page, albumUid, photoUids);
  }

  async getAlbumPhotosViaAPI(albumUid: string): Promise<Array<{ UID: string }>> {
    return getAlbumPhotos(this.page, albumUid);
  }

  async deleteTrackedAlbums(): Promise<void> {
    if (this._trackedAlbumUids.length === 0) return;
    for (const uid of this._trackedAlbumUids) {
      await deleteAlbum(this.page, uid);
    }
    this._trackedAlbumUids = [];
  }
}
