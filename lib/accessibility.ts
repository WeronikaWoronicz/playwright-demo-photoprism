import { AxeBuilder } from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const KNOWN_DISABLED_RULES: string[] = [
  'aria-required-children',
  'button-name',
  'color-contrast',
  'label',
  'link-name',
  'meta-refresh',
  'meta-viewport',
  'region',
  'scrollable-region-focusable',
  'aria-progressbar-name',
  'select-name',
];

export async function checkA11y(page: Page, options?: { disableRules?: string[] }): Promise<void> {
  const disabledRules = [...KNOWN_DISABLED_RULES, ...(options?.disableRules ?? [])];
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(disabledRules).analyze();
  expect(results.violations).toEqual([]);
}
