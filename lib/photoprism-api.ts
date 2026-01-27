import { BrowserContext } from '@playwright/test';
import { BASE_URL } from '../config.js';

export async function deleteAllPhotos(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL);

    const sessionToken = await page.evaluate(() => window.localStorage.getItem('session.token'));
    if (!sessionToken) {
      throw new Error('No session token found in localStorage');
    }

    const photoUIDs = await getAllPhotoUIDs(page, sessionToken);
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

async function getAllPhotoUIDs(page: any, sessionToken: string): Promise<string[]> {
  const response = await page.request.get(`${BASE_URL}/api/v1/photos`, {
    params: {
      count: 10000,
      offset: 0,
    },
    headers: {
      'X-Auth-Token': sessionToken,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get photos: ${response.status()}`);
  }

  const data = await response.json();
  return data.map((photo: any) => photo.UID);
}
