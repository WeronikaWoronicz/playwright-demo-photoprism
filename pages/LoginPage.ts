import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userNameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly photoprismLogo: Locator;
  readonly adminAvatar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userNameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.photoprismLogo = page.getByRole('link', { name: 'PhotoPrism' });
    this.adminAvatar = page.getByTitle('admin');
  }

  async clickSignInBtn() {
    await this.signInButton.click();
  }

  async clickPhotoprismLogoMenu() {
    await this.photoprismLogo.click();
  }

  async clickAdminTitle() {
    await this.adminAvatar.scrollIntoViewIfNeeded();
    await this.adminAvatar.click();
  }

  async fillUserName(user: string) {
    await this.userNameInput.fill(user);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async login(username: string, password: string) {
    await this.fillUserName(username);
    await this.fillPassword(password);
    await this.clickSignInBtn();
  }
}
