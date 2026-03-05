import { type Page, type APIRequestContext } from '@playwright/test';
import { BASE_URL } from '../config.js';

export class SharePage {
  constructor(readonly page: Page) {}

  private async getAuthToken(): Promise<string> {
    const token = await this.page.evaluate(() => window.localStorage.getItem('session.token'));
    if (!token) throw new Error('No auth token found in localStorage');
    return token;
  }

  async createShareLink(photoUid: string, request: APIRequestContext): Promise<string> {
    const token = await this.getAuthToken();
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
