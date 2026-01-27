import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../config.js';

export class UploadPage {
  constructor(private page: Page) {}

  async navigateToUploadForm() {
    await this.page.goto(BASE_URL);
    await this.openUploadMenu();
  }

  private async openUploadMenu() {
    await this.page.waitForLoadState('networkidle');
    const menuButton = await this.findMenuButton();
    await menuButton.click();
    await this.page.getByText('Upload').click();
  }

  // Note: Adding aria-label to the menu button would improve accessibility and test reliability,
  // but this requires changes in the PhotoPrism application itself.
  private async findMenuButton() {
    // Try aria-label first (accessible)
    const ariaLabelMenu = this.page.locator('button[aria-label*="menu" i], button[aria-label*="more" i]').first();
    if ((await ariaLabelMenu.count()) > 0 && (await ariaLabelMenu.isVisible())) {
      return ariaLabelMenu;
    }

    // Try title attribute
    const titleMenu = this.page.locator('button[title*="menu" i], button[title*="more" i]').first();
    if ((await titleMenu.count()) > 0 && (await titleMenu.isVisible())) {
      return titleMenu;
    }

    // Fallback to positional selector - brittle but works until PhotoPrism adds proper aria-labels
    return this.page.getByRole('button').nth(5);
  }

  async uploadFiles(filePaths: string | string[]) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: /browse/i }).click();
    const fileChooser = await fileChooserPromise;

    if (typeof filePaths === 'string') {
      await fileChooser.setFiles(filePaths);
    } else {
      await fileChooser.setFiles(filePaths);
    }
  }

  async waitForUploadComplete() {
    await expect(this.page.getByText('Upload has been processed')).toBeVisible({
      timeout: 30000,
    });
  }

  async navigateToReviewSection() {
    await this.page.goto(`${BASE_URL}/library/review`);
    await this.page.waitForLoadState('networkidle');
  }

  async approveAllPhotos() {
    const photoThumbnails = this.page.locator('button:has(img), a:has(img), div[role="button"]:has(img)');
    const photoCount = await photoThumbnails.count();

    if (photoCount === 0) {
      console.warn('No photos found in Review section');
      return;
    }

    await photoThumbnails.first().click();
    await this.page.keyboard.press('Control+A');

    const approveButton = this.page.getByRole('button', { name: /approve/i }).first();
    if ((await approveButton.count()) > 0) {
      await approveButton.click();
    } else {
      console.warn('Approve button not found');
    }
  }

  async navigateToLibrary() {
    await this.page.goto(`${BASE_URL}/library/browse`);
    await this.page.waitForLoadState('networkidle');
  }
}
