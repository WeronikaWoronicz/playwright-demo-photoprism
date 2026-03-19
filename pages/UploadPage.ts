import { type Page } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { uploadMessages } from '../lib/constants.js';
import { copyFileSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { randomBytes } from 'crypto';
import { getSessionToken } from '../lib/auth.js';

const selectors = {
  nav: {
    searchInput: 'Search',
  },
  upload: {
    browseButton: /browse/i,
    completeText: uploadMessages.uploadCompleted,
  },
  photo: {
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
  },
};

export class UploadPage {
  private _trackedUids: string[] = [];
  private _uniqueTag: string;
  private _tempFiles: string[] = [];
  private _uploadProcessingPromise: Promise<unknown> | null = null;

  constructor(readonly page: Page) {
    this._uniqueTag = randomBytes(8).toString('hex');
  }

  get trackedUids(): string[] {
    return [...this._trackedUids];
  }

  async getNewPhotoCount(): Promise<number> {
    return (await this.fetchPhotoUidsByFilename(this._uniqueTag)).length;
  }

  private async fetchPhotoUidsByFilename(uniqueTag: string): Promise<string[]> {
    let token: string | undefined;
    try {
      token = await getSessionToken(this.page);
    } catch {
      return [];
    }
    const [libResp, revResp] = await Promise.all([
      this.page.request.get(`${BASE_URL}/api/v1/photos`, {
        params: { count: 100, offset: 0 },
        headers: { 'X-Auth-Token': token },
      }),
      this.page.request.get(`${BASE_URL}/api/v1/photos`, {
        params: { count: 100, offset: 0, review: true },
        headers: { 'X-Auth-Token': token },
      }),
    ]);
    const all: Array<{ UID: string; OriginalName?: string }> = [];
    if (libResp.ok()) all.push(...((await libResp.json()) as Array<{ UID: string; OriginalName?: string }>));
    if (revResp.ok()) all.push(...((await revResp.json()) as Array<{ UID: string; OriginalName?: string }>));
    return [...new Set(all.filter((p) => p.OriginalName?.includes(uniqueTag)).map((p) => p.UID))];
  }

  async navigateToUploadForm() {
    await this.page.goto(BASE_URL + '/library/browse');
    await this.openUploadMenu();
  }

  private async openUploadMenu() {
    await this.page.locator('a.nav-upload').waitFor({ state: 'attached', timeout: 10000 });
    await this.page.evaluate(() => (document.querySelector('a.nav-upload') as HTMLElement).click());
    await this.page.getByRole('button', { name: selectors.upload.browseButton }).waitFor({ timeout: 10000 });
  }

  async uploadFiles(filePaths: string | string[]) {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const uniquePaths = paths.map((p) => {
      const ext = extname(p);
      const base = basename(p, ext);
      const dir = dirname(p);
      const uniqueName = `${base}_${this._uniqueTag}${ext}`;
      const dest = join(dir, uniqueName);
      copyFileSync(p, dest);
      const srcBuf = readFileSync(dest);
      if (srcBuf.length >= 2 && srcBuf[0] === 0xff && srcBuf[1] === 0xd8) {
        const comment = Buffer.from(this._uniqueTag, 'utf8');
        const comLen = 2 + comment.length;
        const comSeg = Buffer.allocUnsafe(2 + 2 + comment.length);
        comSeg[0] = 0xff;
        comSeg[1] = 0xfe;
        comSeg[2] = (comLen >> 8) & 0xff;
        comSeg[3] = comLen & 0xff;
        comment.copy(comSeg, 4);
        writeFileSync(dest, Buffer.concat([srcBuf.slice(0, 2), comSeg, srcBuf.slice(2)]));
      }
      this._tempFiles.push(dest);
      return dest;
    });
    this._uploadProcessingPromise = this.page
      .waitForResponse((resp) => resp.url().includes('/upload/') && resp.request().method() === 'POST', {
        timeout: 60000,
      })
      .catch(() => {
        console.debug('UploadPage: upload response not captured (may have completed before listener)');
        return null;
      });
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: selectors.upload.browseButton }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(uniquePaths);
  }

  cleanupTempFiles() {
    for (const f of this._tempFiles) {
      if (existsSync(f)) unlinkSync(f);
    }
    this._tempFiles = [];
  }

  async waitForUploadComplete() {
    await this.page.getByText(selectors.upload.completeText).waitFor({ timeout: 30000 });
    if (this._uploadProcessingPromise) {
      await this._uploadProcessingPromise;
      this._uploadProcessingPromise = null;
    }
  }

  async waitForPhotoInLibrary(_minCount = 1, _filename?: string) {
    const { expect } = await import('@playwright/test');
    const effectiveMinCount = this._tempFiles.length > 0 ? this._tempFiles.length : _minCount;
    let ownReviewUids: string[] = [];
    let ownLibraryUids: string[] = [];
    await expect
      .poll(
        async () => {
          const byTag = await this.fetchPhotoUidsByFilename(this._uniqueTag);
          let token: string | undefined;
          try {
            token = await getSessionToken(this.page);
          } catch {
            // Token not available
          }
          if (token) {
            const reviewResp = await this.page.request.get(`${BASE_URL}/api/v1/photos`, {
              params: { count: 10000, offset: 0, review: true },
              headers: { 'X-Auth-Token': token },
            });
            const reviewUids = reviewResp.ok()
              ? ((await reviewResp.json()) as Array<{ UID: string }>).map((p) => p.UID)
              : [];
            const reviewSet = new Set(reviewUids);
            ownReviewUids = byTag.filter((uid) => reviewSet.has(uid));
            ownLibraryUids = byTag.filter((uid) => !reviewSet.has(uid));
          } else {
            ownLibraryUids = byTag;
          }
          return byTag.length;
        },
        { timeout: 120000 }
      )
      .toBeGreaterThanOrEqual(effectiveMinCount);
    let token: string | undefined;
    try {
      token = await getSessionToken(this.page);
    } catch {
      // Token not available
    }
    if (token && ownReviewUids.length > 0) {
      await this.page.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
        data: { photos: ownReviewUids },
        headers: { 'X-Auth-Token': token },
      });
    }
    const allNewUids = [...new Set([...ownReviewUids, ...ownLibraryUids])];
    this._trackedUids = [...new Set([...this._trackedUids, ...allNewUids])];
    await this.page.goto(`${BASE_URL}/library/browse`);
    for (const uid of allNewUids) {
      await this.page
        .locator(`.is-photo[data-uid="${uid}"]`)
        .waitFor({ state: 'visible', timeout: 30000 })
        .catch(() => {});
    }
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
