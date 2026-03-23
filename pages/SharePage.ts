import { Page, APIRequestContext } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { getSessionToken } from '../lib/auth.js';

export class SharePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createShareLink(photoUid: string, request: APIRequestContext): Promise<string> {
    const token = await getSessionToken(this.page);
    const headers = { 'X-Auth-Token': token };

    const albumResp = await request.post(`${BASE_URL}/api/v1/albums`, {
      headers,
      data: { Title: 'Share-' + photoUid, Type: 'album' },
    });
    const album = await albumResp.json();
    const albumUid: string = album.UID;

    await request.post(`${BASE_URL}/api/v1/albums/${albumUid}/photos`, {
      headers,
      data: { photos: [photoUid] },
    });

    const linkResp = await request.post(`${BASE_URL}/api/v1/albums/${albumUid}/links`, {
      headers,
      data: {},
    });
    const link = await linkResp.json();
    return (link.Token as string) ?? albumUid;
  }

  async navigateToShareLink(token: string) {
    await this.page.goto(BASE_URL + '/s/' + token);
  }

  getShareUrl(token: string): string {
    return BASE_URL + '/s/' + token;
  }
}
