import { type Page, expect } from '@playwright/test';

const selectors = {
  photo: {
    titleInput: 'Title',
  },
};

export class PhotoDetailPage {
  private _lastOpenedUid: string | null = null;

  constructor(readonly page: Page) {}

  async openPhoto(uid: string) {
    this._lastOpenedUid = uid;
    await this.page.locator(`.is-photo[data-uid="${uid}"]`).click();
  }

  async openEditPanel(uid?: string) {
    const effectiveUid = uid ?? this._lastOpenedUid;
    if (!effectiveUid) throw new Error('openEditPanel requires a uid or a prior openPhoto() call');
    await this.page.locator(`.is-photo[data-uid="${effectiveUid}"]`).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.evaluate((targetUid: string) => {
      const tile = document.querySelector(`.is-photo[data-uid="${targetUid}"]`);
      const editBtn = tile?.querySelector('.action-title-edit') as HTMLElement | null;
      if (!editBtn) throw new Error(`Edit button for photo ${targetUid} not found`);
      editBtn.click();
    }, effectiveUid);
    await this.page.getByRole('tab', { name: /details/i }).waitFor({ timeout: 15000 });
  }

  async editTitle(title: string) {
    const input = this.page.getByRole('textbox', { name: selectors.photo.titleInput });
    await input.click({ clickCount: 3 });
    await input.pressSequentially(title, { delay: 50 });
    await this.page.keyboard.press('Tab');
    await expect(input).toHaveValue(title);
  }

  async saveChanges() {
    const btn = this.page.getByRole('button', { name: /save/i });
    await expect(btn).toBeEnabled({ timeout: 15000 });
    await Promise.all([
      this.page.waitForResponse((resp) => resp.url().includes('/api/v1/photos/') && resp.request().method() === 'PUT', {
        timeout: 15000,
      }),
      btn.click(),
    ]);
  }

  async archiveSelectedPhoto() {
    await this.page.locator('.clipboard-container .action-menu').click();
    await this.page.locator('.clipboard-container .action-archive').click();
  }

  async rotatePhoto() {
    await this.page.getByRole('row', { name: 'Orientation' }).getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: '90°' }).click();
  }
}
