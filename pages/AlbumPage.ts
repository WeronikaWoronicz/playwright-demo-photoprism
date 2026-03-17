import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { randomBytes } from 'crypto';
import { createAlbum, addPhotosToAlbum, getAlbumPhotos, deleteAlbum } from '../lib/photoprism-api.js';

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
