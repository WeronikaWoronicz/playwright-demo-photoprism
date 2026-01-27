import { LoginPage } from '../pages/LoginPage.js';
import { UploadPage } from '../pages/UploadPage.js';
import { test as base } from '@playwright/test';
import { deleteAllPhotos } from '../lib/photoprism-api.js';

export type Pages = {
  loginPage: LoginPage;
  uploadPage: UploadPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  uploadPage: async ({ page, context }, use) => {
    await deleteAllPhotos(context);
    await use(new UploadPage(page));
    await deleteAllPhotos(context);
  },
});
