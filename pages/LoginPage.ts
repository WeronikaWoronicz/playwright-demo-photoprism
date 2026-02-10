import { type Page } from '@playwright/test';

const selectors = {
  input: {
    userName: '#auth-username',
    password: '#auth-password',
  },
  buttons: {
    signIn: 'Sign in',
  },
  logo: {
    photoprism: 'PhotoPrism',
  },
  user: {
    adminTitle: 'admin',
  },
};

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickSignInBtn() {
    await this.page.getByText(selectors.buttons.signIn).click();
  }

  async clickPhotoprismLogoMenu() {
    await this.page.locator('a', { has: this.page.getByAltText(selectors.logo.photoprism) }).click();
  }

  async clickAdminTitle() {
    const adminAvatar = this.page.getByTitle(selectors.user.adminTitle);
    await adminAvatar.scrollIntoViewIfNeeded();
    await adminAvatar.click();
  }

  async fillUserName(user: string) {
    await this.page.locator(selectors.input.userName).fill(user);
  }

  async fillPassword(password: string) {
    await this.page.locator(selectors.input.password).fill(password);
  }
}
