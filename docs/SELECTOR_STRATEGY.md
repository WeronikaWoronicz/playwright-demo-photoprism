# Selector Strategy for PhotoPrism Tests

## Problem

The upload tests use `page.getByRole('button').nth(5)` which is brittle and can break when:

- PhotoPrism UI changes
- Buttons are added/removed
- Buttons load in different order

## Solution

We've implemented a **NavigationHelper** with multiple combined selectors that tries different strategies in order of reliability.

## Files Modified

- **[lib/navigation.ts](../lib/navigation.ts)** - Navigation helper with smart selector fallback
- **[tests/upload.spec.ts](../tests/upload.spec.ts)** - Uses NavigationHelper instead of raw selectors
- **[tests/inspect-selectors.spec.ts](../tests/inspect-selectors.spec.ts)** - Debug test to discover better selectors

## How It Works

The `NavigationHelper.findMenuButton()` tries multiple selector strategies in order:

1. **Aria-label** - `button[aria-label*="menu"]` (Most reliable if present)
2. **Title attribute** - `button[title*="menu"]` (Good fallback)
3. **Scoped nth** - `nav button, header button` (Better than global nth)
4. **Vuetify classes** - `button.v-btn` (PhotoPrism uses Vuetify framework)
5. **Fallback** - `page.getByRole('button').nth(5)` (Original approach)

Each strategy logs which one it uses, making debugging easier.

## Usage

```typescript
import { NavigationHelper } from '../lib/navigation.js';

test('My test', async ({ page }) => {
  const nav = new NavigationHelper(page);

  await page.goto(BASE_URL);
  await nav.navigateToUpload();
  // ... rest of test
});
```

## Finding Better Selectors

If the current selectors become unstable, use the inspector test:

### Option 1: Run the debug test

```bash
# Remove .skip from the test first
npx playwright test inspect-selectors --headed
```

This will:

- Log all button attributes to console
- Pause the browser for manual inspection
- Show you what attributes are available

### Option 2: Use Playwright Codegen

```bash
npx playwright codegen <your-photoprism-url>
```

Then:

1. Login to PhotoPrism
2. Click the menu button
3. See what selector Playwright suggests
4. Update `NavigationHelper.findMenuButton()` with the new selector

### Option 3: Use Playwright Inspector

```bash
npx playwright test upload --headed --debug
```

Click "Pick Locator" and inspect the button to see available attributes.

## Updating Selectors

When you find a better selector, add it to `lib/navigation.ts`:

```typescript
private async findMenuButton(): Promise<Locator> {
  // Add your new strategy at the top (highest priority)
  const newStrategy = this.page.locator('your-better-selector');
  if (await newStrategy.count() > 0 && await newStrategy.isVisible()) {
    console.log('Using new strategy for menu button');
    return newStrategy;
  }

  // ... existing strategies below
}
```

## Benefits

✅ **More stable** - Tries multiple selectors instead of just one
✅ **Self-documenting** - Console logs show which strategy worked
✅ **Easy to maintain** - Single place to update selectors
✅ **No frontend changes** - Works without modifying PhotoPrism
✅ **Follows your patterns** - Uses same Page Object Model approach as LoginPage

## Tradeoffs

⚠️ **Still somewhat brittle** - Without `data-testid` attributes, all selectors have some risk
⚠️ **Slightly slower** - Checks multiple selectors before finding the right one
⚠️ **Requires updates** - When PhotoPrism updates UI, selectors may need adjustment

## Best Practice

If PhotoPrism becomes unstable frequently:

1. Run `inspect-selectors.spec.ts` to see what changed
2. Update the selector strategies in `NavigationHelper`
3. Consider asking PhotoPrism maintainers to add `data-testid` attributes for testing
