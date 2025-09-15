import { LoginPage } from '../pages/LoginPage.js'
import { test as base } from '@playwright/test'

export type Pages = {
    loginPage: LoginPage;
};

export const test = base.extend<Pages>(
    {
        loginPage: async ({ page }, use) => {
            await use(new LoginPage(page));
        },
    })
