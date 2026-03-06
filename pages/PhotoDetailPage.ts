import { type Page } from '@playwright/test';

const selectors = {
  photo: {
    // No accessible role/label — CSS class is the only stable hook.
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
    await this.page.locator('.meta-filename').waitFor({ state: 'visible', timeout: 15000 });
    // JS click — Vue click handler may not be registered when Playwright tries to click.
    await this.page.locator(selectors.photo.editTitleButton).evaluate((el: HTMLElement) => el.click());
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
    // Click the outer combobox container — NOT the hidden inner input.
    await this.page.getByRole('row', { name: 'Orientation' }).getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: '90°' }).click();
  }
}
