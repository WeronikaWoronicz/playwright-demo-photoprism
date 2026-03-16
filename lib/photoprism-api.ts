import { BrowserContext, Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

async function getSessionToken(page: Page): Promise<string | undefined> {
  const state = await page.context().storageState();
  return state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;
}

export async function createAlbum(page: Page, name: string): Promise<string> {
  const token = await getSessionToken(page);
  if (!token) throw new Error('No session token');
  const resp = await page.request.post(`${BASE_URL}/api/v1/albums`, {
    headers: { 'X-Auth-Token': token },
    data: { Title: name },
  });
  const body = await resp.json();
  return body.UID as string;
}

export async function addPhotosToAlbum(page: Page, albumUid: string, photoUids: string[]): Promise<void> {
  const token = await getSessionToken(page);
  if (!token) throw new Error('No session token');
  await page.request.post(`${BASE_URL}/api/v1/albums/${albumUid}/photos`, {
    headers: { 'X-Auth-Token': token },
    data: { photos: photoUids },
  });
}

export async function getAlbumPhotos(page: Page, albumUid: string): Promise<Array<{ UID: string }>> {
  const token = await getSessionToken(page);
  if (!token) throw new Error('No session token');
  const resp = await page.request.get(`${BASE_URL}/api/v1/photos`, {
    params: { count: 1000, album: albumUid },
    headers: { 'X-Auth-Token': token },
  });
  return resp.json();
}

export async function deleteAlbum(page: Page, uid: string): Promise<void> {
  const token = await getSessionToken(page);
  if (!token) return;
  await page.request
    .delete(`${BASE_URL}/api/v1/albums/${uid}`, {
      headers: { 'X-Auth-Token': token },
    })
    .catch(() => {});
}

export async function getPhotoUidsByFilenameTag(
  page: Page,
  tag: string
): Promise<{ libraryUids: string[]; reviewUids: string[] }> {
  const token = await getSessionToken(page);
  if (!token) return { libraryUids: [], reviewUids: [] };
  const [libResp, revResp] = await Promise.all([
    page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10000, offset: 0 },
      headers: { 'X-Auth-Token': token },
    }),
    page.request.get(`${BASE_URL}/api/v1/photos`, {
      params: { count: 10000, offset: 0, review: true },
      headers: { 'X-Auth-Token': token },
    }),
  ]);
  const libPhotos = libResp.ok() ? ((await libResp.json()) as Array<{ UID: string; OriginalName?: string }>) : [];
  const revPhotos = revResp.ok() ? ((await revResp.json()) as Array<{ UID: string; OriginalName?: string }>) : [];
  const matchesTag = (p: { OriginalName?: string }) => p.OriginalName?.includes(tag) ?? false;
  return {
    libraryUids: libPhotos.filter(matchesTag).map((p) => p.UID),
    reviewUids: revPhotos.filter(matchesTag).map((p) => p.UID),
  };
}

export async function approvePhotos(page: Page, uids: string[]): Promise<void> {
  if (uids.length === 0) return;
  const token = await getSessionToken(page);
  if (!token) return;
  await page.request.post(`${BASE_URL}/api/v1/batch/photos/approve`, {
    data: { photos: uids },
    headers: { 'X-Auth-Token': token },
  });
}

export async function triggerIndex(page: Page): Promise<void> {
  const token = await getSessionToken(page);
  if (!token) return;
  page.request
    .post(`${BASE_URL}/api/v1/index`, {
      data: { action: 'index' },
      headers: { 'X-Auth-Token': token },
    })
    .catch(() => {});
}

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
  if (!response.ok() && response.status() !== 400 && response.status() !== 404) {
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
