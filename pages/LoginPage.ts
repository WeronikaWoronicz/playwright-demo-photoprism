import { expect, type Page } from '@playwright/test';
import { LoginPageSelectors } from './LoginPageSelectors.js';
const { input, buttons } = LoginPageSelectors

export class LoginPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page; 
    }

    // steps
    async clickSignInBtn() {
        await this.page.getByText(buttons.signIn).click();
    }

    async clickAdminTitle() {
        const adminAvatar = this.page.getByTitle('admin');
        await adminAvatar.scrollIntoViewIfNeeded();
        await adminAvatar.click();
    }

    async fillUserName(user: string) {
        await this.page.locator(input.userName).fill(user);
    }

    async fillPassword(password: string) {
        await this.page.locator(input.password).fill(password);
    }

    async loginViaAPI(username: string, password: string) {
        const response = await this.page.request.post(
            `${process.env.BASE_URL}/api/v1/session`, {
            data: { username, password },
        });
        expect(response.ok()).toBeTruthy(
        )
    }

    // assertions
    async assertLoginSuccess() {
        await expect(this.page.getByTitle('admin')).toBeVisible();
        this.clickAdminTitle();
        await this.page.getByTitle('admin').click();
        await expect(this.page.getByRole('textbox', { name: 'Display Name Display Name' })).toHaveValue('Admin');
    }
}