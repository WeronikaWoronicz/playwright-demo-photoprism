import { BrowserContext, Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

export async function deleteAllPhotos(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL);

    const sessionToken = await page.evaluate(() => window.localStorage.getItem('session.token'));
    if (!sessionToken) {
      throw new Error('No session token found in localStorage');
    }

    const reviewUIDs = await getAllPhotoUIDs(page, sessionToken, true);
    if (reviewUIDs.length > 0) {
      const approveResponse = await page.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
        data: { photos: reviewUIDs },
        headers: { 'X-Auth-Token': sessionToken },
      });
      if (!approveResponse.ok()) {
        throw new Error(`Failed to approve review photos before delete: ${approveResponse.status()}`);
      }
    }

    const photoUIDs = await getAllPhotoUIDs(page, sessionToken, false);
    if (photoUIDs.length === 0) {
      return;
    }

    const response = await page.request.post(`${BASE_URL}/api/v1/batch/photos/delete`, {
      data: {
        photos: photoUIDs,
      },
      headers: {
        'X-Auth-Token': sessionToken,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to delete photos: ${response.status()}`);
    }
  } finally {
    await page.close();
  }
}

async function getAllPhotoUIDs(page: Page, sessionToken: string, review = false): Promise<string[]> {
  const response = await page.request.get(`${BASE_URL}/api/v1/photos`, {
    params: {
      count: 10000,
      offset: 0,
      ...(review ? { review: true } : {}),
    },
    headers: {
      'X-Auth-Token': sessionToken,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get photos: ${response.status()}`);
  }

  const data = (await response.json()) as Array<{ UID: string }>;
  return data.map((photo) => photo.UID);
}
