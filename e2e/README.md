# E2E Tests

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── fixtures/         # Test fixtures and custom test extensions
├── pages/            # Page Object Model classes
├── *.spec.ts         # Test files
└── README.md         # This file
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

## Page Object Model

All page objects should extend the `BasePage` class and be placed in the `pages/` directory.

Example:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: 'Click me' });
  }

  async clickMyButton(): Promise<void> {
    await this.myButton.click();
  }
}
```

## Test Fixtures

Custom fixtures can be defined in `fixtures/` directory. They allow you to extend the base test context.

Example:

```typescript
import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

export const test = base.extend({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.navigate();
    await use(homePage);
  },
});
```

## Best Practices

1. Use semantic locators (getByRole, getByLabel) over CSS selectors
2. Leverage Playwright's auto-waiting capabilities
3. Keep tests independent and isolated
4. Use Page Object Model for maintainability
5. Take screenshots on failure for debugging
6. Use test fixtures for common setup

