import { type Page, expect } from '@playwright/test';

const selectors = {
  photo: {
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
    await this.page.locator(selectors.photo.editTitleButton).evaluate((el: HTMLElement) => el.click());
    await this.page.getByRole('tab', { name: /details/i }).waitFor({ timeout: 15000 });
  }

  async editTitle(title: string) {
    const input = this.page.getByRole('textbox', { name: selectors.photo.titleInput });
    await input.click({ clickCount: 3 });
    await input.pressSequentially(title);
  }

  async editDescription(desc: string) {
    const input = this.page.getByRole('textbox', { name: selectors.photo.descriptionInput });
    await input.click({ clickCount: 3 });
    await input.pressSequentially(desc);
  }

  async addTag(tag: string) {
    await this.page.getByRole('textbox', { name: selectors.photo.tagInput }).fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async saveChanges() {
    const btn = this.page.getByRole('button', { name: /save/i });
    await expect(btn).toBeEnabled({ timeout: 15000 });
    await btn.click();
  }

  async archiveSelectedPhoto() {
    await this.page.locator('.clipboard-container .action-menu').waitFor({ timeout: 10000 });
    await this.page.locator('.clipboard-container .action-menu').click();
    await this.page.locator('#t-clipboard .action-archive').click();
  }

  async rotatePhoto() {
    await this.page.getByRole('row', { name: 'Orientation' }).getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: '90°' }).click();
  }
}
