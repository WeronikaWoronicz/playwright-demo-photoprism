import { BrowserContext } from '@playwright/test';

export async function loginViaAPI(username: string, password: string, browserContext: BrowserContext) {
  const response = await browserContext.request.post(`${process.env.BASE_URL}/api/v1/session`, {
    data: { username, password },
  });
  const body = await response.json();

  const host = new URL(process.env.BASE_URL).hostname;
  await browserContext.addInitScript(
    ([auth_rsp, expectedHost]) => {
      window.localStorage.setItem(`session.id`, auth_rsp.session_id);
      window.localStorage.setItem(`session.token`, auth_rsp.access_token);
      window.localStorage.setItem(`session.provider`, auth_rsp.provider);
      window.localStorage.setItem(`session.scope`, auth_rsp.scope);
    },
    [body, host]
  );
}
