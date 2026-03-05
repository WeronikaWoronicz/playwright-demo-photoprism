import { type Page } from '@playwright/test';

const selectors = {
  photo: {
    // CSS class selector — no accessible role/label exposed for this Vue component button
    editTitleButton: '.action-title-edit',
    titleInput: 'Title',
    descriptionInput: 'Caption',
    tagInput: 'Keywords',
    saveButton: 'Save',
    archiveButton: 'Archive',
    rotateButton: 'Rotate',
  },
};

export class PhotoDetailPage {
  constructor(readonly page: Page) {}

  async openPhoto(uid: string) {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).click();
  }

  async openEditPanel() {
    // Wait for the sidebar to be fully rendered — .meta-filename is the last element to appear.
    await this.page.locator('.meta-filename').waitFor({ state: 'visible', timeout: 15000 });
    // Use evaluate to click the button via JavaScript — more reliable than Playwright click
    // for Vue components where the click handler may not be registered immediately.
    await this.page.locator(selectors.photo.editTitleButton).evaluate((el: HTMLElement) => el.click());
    // Wait for the Details tab to confirm the panel is open and rendered.
    await this.page.getByRole('tab', { name: /details/i }).waitFor({ timeout: 15000 });
  }

  async editTitle(title: string) {
    await this.page.getByRole('textbox', { name: selectors.photo.titleInput }).fill(title);
  }

  async editDescription(desc: string) {
    await this.page.getByRole('textbox', { name: selectors.photo.descriptionInput }).fill(desc);
  }

  async addTag(tag: string) {
    await this.page.getByRole('textbox', { name: selectors.photo.tagInput }).fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async archiveSelectedPhoto() {
    await this.page.locator('.clipboard-container .action-menu').waitFor({ timeout: 10000 });
    await this.page.locator('.clipboard-container .action-menu').click();
    await this.page.locator('#t-clipboard .action-archive').click();
  }

  async rotatePhoto() {
    // The rotate operation is via the Orientation combobox in the Files tab
    // Click the outer Orientation combobox container (cursor=pointer) — NOT the hidden inner input
    await this.page.getByRole('row', { name: 'Orientation' }).getByRole('combobox').first().click();
    // Select 90° rotation
    await this.page.getByRole('option', { name: '90°' }).click();
  }
}
