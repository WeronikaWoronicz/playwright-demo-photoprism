import { test as teardown } from '@playwright/test';
import { deleteAllPhotos, deleteAllAlbums } from '../lib/photoprism-api.js';

teardown('clean test data after suite', async ({ context }) => {
  await deleteAllPhotos(context);
  await deleteAllAlbums(context);
});
