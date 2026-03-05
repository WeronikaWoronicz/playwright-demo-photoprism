import { AxeBuilder } from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Rules known to fail in PhotoPrism due to upstream UI limitations.
// Add new entries here with a comment explaining the violation.
export const KNOWN_DISABLED_RULES: string[] = [
  'aria-required-children', // PhotoPrism navigation uses non-standard ARIA children
  'button-name', // Some icon-only buttons lack accessible names
  'color-contrast', // PhotoPrism uses low-contrast text in some areas
  'label', // Vuetify combobox language selector uses aria-labelledby but axe-core still flags it (upstream issue)
  'link-name', // Some icon-only links lack accessible names
  'meta-refresh', // Albums page uses meta refresh
  'meta-viewport', // PhotoPrism sets user-scalable=no in viewport meta
  'scrollable-region-focusable', // Scrollable containers lack keyboard access
  'aria-progressbar-name', // Vuetify progress bar on upload form lacks accessible name (upstream issue)
  'select-name', // PhotoPrism login language selector lacks accessible label (upstream issue)
];

export async function checkA11y(page: Page, options?: { disableRules?: string[] }): Promise<void> {
  const disabledRules = [...KNOWN_DISABLED_RULES, ...(options?.disableRules ?? [])];
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(disabledRules).analyze();
  expect(results.violations).toEqual([]);
}
