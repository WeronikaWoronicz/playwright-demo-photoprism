import { BrowserContext, Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

export async function deleteAllPhotos(context: BrowserContext) {
  const state = await context.storageState();
  const sessionToken = state.origins
    .flatMap((o) => o.localStorage ?? [])
    .find((item) => item.name === 'session.token')?.value;

  if (!sessionToken) {
    return;
  }

  const reviewUIDs = await getAllPhotoUIDsViaContext(context, sessionToken, { review: true });
  if (reviewUIDs.length > 0) {
    const approveResponse = await context.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
      data: { photos: reviewUIDs },
      headers: { 'X-Auth-Token': sessionToken },
    });
    if (!approveResponse.ok()) {
      throw new Error(`Failed to approve review photos before delete: ${approveResponse.status()}`);
    }
  }

  const [normalUIDs, archivedUIDs] = await Promise.all([
    getAllPhotoUIDsViaContext(context, sessionToken, {}),
    getAllPhotoUIDsViaContext(context, sessionToken, { archived: true }),
  ]);
  const allUIDs = [...new Set([...normalUIDs, ...archivedUIDs])];

  if (allUIDs.length === 0) {
    return;
  }

  const response = await context.request.post(`${BASE_URL}/api/v1/batch/photos/delete`, {
    data: { photos: allUIDs },
    headers: { 'X-Auth-Token': sessionToken },
  });

  if (!response.ok()) {
    throw new Error(`Failed to delete photos: ${response.status()}`);
  }
}

export async function deletePhotosByUids(context: BrowserContext, uids: string[]): Promise<void> {
  if (uids.length === 0) return;
  const state = await context.storageState();
  const sessionToken = state.origins
    .flatMap((o) => o.localStorage ?? [])
    .find((item) => item.name === 'session.token')?.value;
  if (!sessionToken) return;
  const response = await context.request.post(`${BASE_URL}/api/v1/batch/photos/delete`, {
    data: { photos: uids },
    headers: { 'X-Auth-Token': sessionToken },
  });
  if (!response.ok()) {
    throw new Error(`Failed to delete photos by UIDs: ${response.status()}`);
  }
}

async function getAllPhotoUIDsViaContext(
  context: BrowserContext,
  sessionToken: string,
  params: { review?: boolean; archived?: boolean }
): Promise<string[]> {
  const response = await context.request.get(`${BASE_URL}/api/v1/photos`, {
    params: {
      count: 10000,
      offset: 0,
      ...params,
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

export async function deleteAllAlbums(context: BrowserContext) {
  const state = await context.storageState();
  const sessionToken = state.origins
    .flatMap((o) => o.localStorage ?? [])
    .find((item) => item.name === 'session.token')?.value;

  if (!sessionToken) return;

  const response = await context.request.get(`${BASE_URL}/api/v1/albums`, {
    params: { count: 10000 },
    headers: { 'X-Auth-Token': sessionToken },
  });
  if (!response.ok()) return;
  const albums = (await response.json()) as Array<{ UID: string }>;
  if (albums.length === 0) return;

  for (const album of albums) {
    await context.request.delete(`${BASE_URL}/api/v1/albums/${album.UID}`, {
      headers: { 'X-Auth-Token': sessionToken },
    });
  }
}

export async function getPhotos(page: Page, count: number): Promise<Array<{ UID: string; OriginalName: string }>> {
  const state = await page.context().storageState();
  const token = state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;

  if (!token) {
    throw new Error('No session token found in storage state');
  }

  const response = await page.request.get(`${BASE_URL}/api/v1/photos`, {
    params: { count, offset: 0 },
    headers: { 'X-Auth-Token': token },
  });
  if (!response.ok()) {
    throw new Error(`Failed to get photos: ${response.status()}`);
  }
  return response.json() as Promise<Array<{ UID: string; OriginalName: string }>>;
}

export async function approveAllReviewPhotos(page: Page): Promise<void> {
  const state = await page.context().storageState();
  const token = state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;
  if (!token) throw new Error('No session token found in storage state');

  const listResp = await page.request.get(`${BASE_URL}/api/v1/photos`, {
    params: { count: 10000, offset: 0, review: true },
    headers: { 'X-Auth-Token': token },
  });
  if (!listResp.ok()) throw new Error(`Failed to list review photos: ${listResp.status()}`);

  const photos = (await listResp.json()) as Array<{ UID: string }>;
  if (photos.length === 0) return;

  const uids = photos.map((p) => p.UID);
  const approveResp = await page.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
    data: { photos: uids },
    headers: { 'X-Auth-Token': token },
  });
  if (!approveResp.ok()) throw new Error(`Failed to approve review photos: ${approveResp.status()}`);
}
