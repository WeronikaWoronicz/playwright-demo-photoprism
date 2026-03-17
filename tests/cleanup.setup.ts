import { test as setup } from '@playwright/test';
import { deleteAllPhotos, deleteAllAlbums } from '../lib/photoprism-api.js';

setup('clean test data before suite', async ({ context }) => {
  await deleteAllPhotos(context);
  await deleteAllAlbums(context);
});
