import { BrowserContext, Page } from '@playwright/test';
import { BASE_URL } from '../config.js';

export async function getSessionToken(page: Page): Promise<string> {
  const state = await page.context().storageState();
  const token = state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;
  if (!token) throw new Error('Session token not found in localStorage');
  return token;
}

export async function getSessionTokenFromContext(context: BrowserContext): Promise<string> {
  const state = await context.storageState();
  const token = state.origins.flatMap((o) => o.localStorage ?? []).find((item) => item.name === 'session.token')?.value;
  if (!token) throw new Error('Session token not found in localStorage');
  return token;
}

export async function loginViaAPI(
  username: string,
  password: string,
  browserContext: BrowserContext,
  baseUrl?: string
) {
  const url = baseUrl ?? BASE_URL;
  const response = await browserContext.request.post(`${url}/api/v1/session`, {
    data: { username, password },
  });
  const body = await response.json();

  await browserContext.addInitScript(
    (auth_rsp: { session_id: string; access_token: string; provider: string; scope: string }) => {
      window.localStorage.setItem('session.id', auth_rsp.session_id);
      window.localStorage.setItem('session.token', auth_rsp.access_token);
      window.localStorage.setItem('session.provider', auth_rsp.provider);
      window.localStorage.setItem('session.scope', auth_rsp.scope);
    },
    body
  );
}
