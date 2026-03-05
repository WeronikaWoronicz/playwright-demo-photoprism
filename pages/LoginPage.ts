import { type Page } from '@playwright/test';

const selectors = {
  input: {
    userName: 'input[name="username"]',
    password: 'input[type="password"]',
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
    await this.page.getByRole('link', { name: selectors.logo.photoprism }).click();
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

  async login(username: string, password: string) {
    await this.fillUserName(username);
    await this.fillPassword(password);
    await this.clickSignInBtn();
  }
}
