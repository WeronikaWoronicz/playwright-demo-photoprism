import { test } from '../../../fixtures/pages.js';

test.describe('Accessibility Smoke Tests — Admin Features', () => {
  test('TC-A11Y-003 User sees no critical a11y violations on upload form @P1', async ({ uploadPage, a11yCheck }) => {
    await uploadPage.navigateToUploadForm();
    await a11yCheck();
  });

  test('TC-A11Y-004 User sees no critical a11y violations on albums page @P1', async ({ albumPage, a11yCheck }) => {
    await albumPage.navigateToAlbums();
    await a11yCheck();
  });
});
