import type { Page } from '@playwright/test';
import { LoginPageSelectors } from './LoginPageSelectors.js';
const { input, buttons } = LoginPageSelectors

export class LoginPage {
    private page: Page;

constructor(page: Page) {
    this.page = page; 
}

async clickSignInBtn(){
    await this.page.getByText(buttons.signIn).click()
}

async fillUserName(){
    await this.page.locator(input.userName).fill('admin')
}

async fillPassword(){
    await this.page.locator(input.password).fill('admin')
}

}