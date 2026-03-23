import { Page, Locator } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { randomBytes } from 'crypto';
import { createAlbum, addPhotosToAlbum, getAlbumPhotos, deleteAlbum } from '../lib/photoprism-api.js';

export class AlbumPage {
  readonly page: Page;
  readonly addAlbumButton: Locator;
  readonly albumTitleEdit: Locator;
  readonly albumTitleInput: Locator;
  readonly confirmButton: Locator;
  readonly albumResult: Locator;
  private _uniqueTag: string;
  private _trackedAlbumUids: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.addAlbumButton = page.getByTitle('Add Album');
    this.albumTitleEdit = page.locator('.action-title-edit');
    this.albumTitleInput = page.locator('.input-title input');
    this.confirmButton = page.locator('.action-confirm');
    this.albumResult = page.locator('.result.not-selectable');
    this._uniqueTag = randomBytes(4).toString('hex');
  }

  uniqueName(base: string): string {
    return `${base} ${this._uniqueTag}`;
  }

  async navigateToAlbums() {
    await this.page.goto(BASE_URL + '/library/albums');
    await this.addAlbumButton.waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickAddAlbum() {
    const albumCreated = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/albums') && resp.request().method() === 'POST'
    );
    await this.addAlbumButton.click();
    await albumCreated;
    await this.page.reload();
    await this.albumTitleEdit.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async typeAlbumName(name: string) {
    await this.albumTitleEdit.first().click();
    await this.albumTitleInput.fill(name);
  }

  async confirmCreate() {
    await this.confirmButton.click();
  }

  async getAlbumTitles(): Promise<string[]> {
    const titles = this.albumResult.locator('.action-title-edit');
    return titles.allTextContents();
  }

  async isAlbumVisible(name: string): Promise<boolean> {
    const titles = await this.getAlbumTitles();
    return titles.some((t) => t.trim() === name);
  }

  async getAlbumCount(): Promise<number> {
    return this.albumResult.count();
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
