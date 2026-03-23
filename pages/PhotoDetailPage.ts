import { Page, Locator, expect } from '@playwright/test';

export class PhotoDetailPage {
  readonly page: Page;
  readonly detailsTab: Locator;
  readonly titleInput: Locator;
  readonly saveButton: Locator;
  readonly clipboardMenu: Locator;
  readonly clipboardArchive: Locator;
  readonly orientationCombobox: Locator;
  readonly rotate90Option: Locator;
  private _lastOpenedUid: string | null = null;

  constructor(page: Page) {
    this.page = page;
    this.detailsTab = page.getByRole('tab', { name: /details/i });
    this.titleInput = page.getByRole('textbox', { name: 'Title' });
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.clipboardMenu = page.locator('.clipboard-container .action-menu');
    this.clipboardArchive = page.locator('.clipboard-container .action-archive');
    this.orientationCombobox = page.getByRole('row', { name: 'Orientation' }).getByRole('combobox').first();
    this.rotate90Option = page.getByRole('option', { name: '90°' });
  }

  async openPhoto(uid: string) {
    this._lastOpenedUid = uid;
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).click();
  }

  async openEditPanel(uid: string) {
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.evaluate(
      (uid) => (document.querySelector(`.is-photo[data-uid="${uid}"] .action-title-edit`) as HTMLElement).click(),
      uid
    );
    await this.detailsTab.waitFor({ timeout: 15000 });
  }

  async openEditPanelFromCache() {
    if (!this._lastOpenedUid) {
      throw new Error('openEditPanelFromCache requires a prior openPhoto() call to set _lastOpenedUid');
    }
    return this.openEditPanel(this._lastOpenedUid);
  }

  async editTitle(title: string) {
    await this.titleInput.click({ clickCount: 3 });
    await this.titleInput.pressSequentially(title, { delay: 50 });
    await this.page.keyboard.press('Tab');
    await expect(this.titleInput).toHaveValue(title);
  }

  async saveChanges() {
    await expect(this.saveButton).toBeEnabled({ timeout: 15000 });
    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      }),
      this.saveButton.click(),
    ]);
  }

  async archiveSelectedPhoto() {
    await this.clipboardMenu.click();
    await this.clipboardArchive.click();
  }

  async rotatePhoto() {
    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT', {
        timeout: 30000,
      }),
      (async () => {
        await this.orientationCombobox.click();
        await this.rotate90Option.click();
      })(),
    ]);
  }
}
