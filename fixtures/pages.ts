import { LoginPage } from '../pages/LoginPage.js';
import { UploadPage } from '../pages/UploadPage.js';
import { LibraryPage } from '../pages/LibraryPage.js';
import { PhotoDetailPage } from '../pages/PhotoDetailPage.js';
import { SearchPage } from '../pages/SearchPage.js';
import { SharePage } from '../pages/SharePage.js';
import { AdminPage } from '../pages/AdminPage.js';
import { AlbumPage } from '../pages/AlbumPage.js';
import { checkA11y } from '../lib/accessibility.js';
import { test as base } from '@playwright/test';
import { deletePhotosByUids, deleteAllAlbums } from '../lib/photoprism-api.js';
import { createPath } from '../lib/assets.js';

export type Pages = {
  loginPage: LoginPage;
  uploadPage: UploadPage;
  libraryPage: LibraryPage;
  photoDetailPage: PhotoDetailPage;
  searchPage: SearchPage;
  sharePage: SharePage;
  adminPage: AdminPage;
  albumPage: AlbumPage;
  a11yCheck: (opts?: { disableRules?: string[] }) => Promise<void>;
  pageErrors: Error[];
  uploadedPhoto: { uid: string };
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  uploadPage: async ({ page, context }, use) => {
    const uploadPageObj = new UploadPage(page);
    await use(uploadPageObj);
    await deletePhotosByUids(context, uploadPageObj.trackedUids);
  },
  libraryPage: async ({ page }, use) => {
    await use(new LibraryPage(page));
  },
  photoDetailPage: async ({ page }, use) => {
    await use(new PhotoDetailPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  sharePage: async ({ page, context }, use) => {
    await use(new SharePage(page));
    await deleteAllAlbums(context);
  },
  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
  albumPage: async ({ page, context }, use) => {
    await deleteAllAlbums(context);
    await use(new AlbumPage(page));
    await deleteAllAlbums(context);
  },
  a11yCheck: async ({ page }, use) => {
    await use((opts) => checkA11y(page, opts));
  },
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await use(errors);
  },
  uploadedPhoto: [
    async ({ uploadPage }, use) => {
      const photoPath = createPath('test-assets', 'photo-1.jpg');
      await uploadPage.navigateToUploadForm();
      await uploadPage.uploadFiles(photoPath);
      await uploadPage.waitForUploadComplete();
      await uploadPage.waitForPhotoInLibrary();
      await use({ uid: uploadPage.trackedUids[0] });
    },
    { scope: 'test' },
  ],
});
