import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../config.js';
import { uploadMessages } from '../lib/constants.js';

const selectors = {
  nav: {
    uploadButton: 'Upload photos',
    searchInput: 'Search',
  },
  upload: {
    browseButton: /browse/i,
    completeText: uploadMessages.uploadCompleted,
  },
  photo: {
    tile: '.is-photo',
    renderedTile: '.is-photo[data-uid]',
    selectButton: '.is-photo button.input-select',
  },
  clipboard: {
    fab: '.clipboard-container .action-menu',
    container: '#t-clipboard',
    approveButton: 'Approve',
    approvedText: 'Selection approved',
  },
};

export class UploadPage {
  constructor(readonly page: Page) {}

  async navigateToUploadForm() {
    await this.page.goto(BASE_URL);
    await this.openUploadMenu();
  }

  private async openUploadMenu() {
    const uploadBtn = this.page.getByRole('button', { name: selectors.nav.uploadButton });
    await uploadBtn.waitFor();
    await uploadBtn.click();
  }

  async uploadFiles(filePaths: string | string[]) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: selectors.upload.browseButton }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(filePaths);
  }

  async waitForUploadComplete() {
    await this.page.getByText(selectors.upload.completeText).waitFor({ timeout: 30000 });
  }

  async navigateToReviewSection() {
    await this.page.goto(`${BASE_URL}/library/review`);
    await this.page.locator(selectors.photo.tile).first().waitFor({ timeout: 30000 });
  }

  async approveAllPhotos() {
    await expect(this.page.locator(selectors.photo.tile).first()).toBeVisible({ timeout: 30000 });

    // Standard .click() is unreliable on Vue components; dispatchEvent triggers the correct event chain
    await this.page.evaluate((selector) => {
      document.querySelectorAll(selector).forEach((btn) => {
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }, selectors.photo.selectButton);

    const clipboardFab = this.page.locator(selectors.clipboard.fab);
    await expect(clipboardFab).toBeVisible({ timeout: 10000 });
    await clipboardFab.click();

    const approveBtn = this.page.locator(selectors.clipboard.container).getByRole('button', { name: selectors.clipboard.approveButton });
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    await expect(this.page.getByText(selectors.clipboard.approvedText)).toBeVisible({ timeout: 10000 });
  }

  async navigateToLibrary() {
    await this.page.goto(`${BASE_URL}/library/browse`);
    await this.page.getByRole('textbox', { name: selectors.nav.searchInput }).waitFor();
  }

  async getRenderedPhotoUids(): Promise<string[]> {
    const tiles = this.page.locator(selectors.photo.renderedTile);
    return tiles.evaluateAll((els: Element[]) =>
      els.map((el) => el.getAttribute('data-uid') as string),
    );
  }
}
