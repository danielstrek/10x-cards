# Testing Guide for 10x-cards

This project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end (E2E) tests.

## Table of Contents

- [Unit Tests (Vitest)](#unit-tests-vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Test Scripts](#test-scripts)
- [Best Practices](#best-practices)

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (recommended for development)
npm run test:unit:watch

# Run tests with UI
npm run test:unit:ui

# Run tests with coverage
npm run test:unit:coverage
```

### Writing Unit Tests

Unit tests are located in the `tests/unit/` directory. Test files should follow the naming convention `*.test.ts` or `*.test.tsx`.

#### Example Unit Test

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
  it('should return expected value', () => {
    const result = myFunction(1, 2);
    expect(result).toBe(3);
  });
});
```

#### Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Mocking

#### Function Mocks

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

#### Module Mocks

```typescript
vi.mock('@/lib/services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
}));
```

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

### Writing E2E Tests

E2E tests are located in the `e2e/` directory. Test files should follow the naming convention `*.spec.ts`.

#### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/10x-cards/);
});
```

#### Using Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';

test('should navigate to generate page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigate();
  await homePage.clickGenerate();
  
  await expect(page).toHaveURL(/\/generate/);
});
```

### Page Object Model

Page objects are located in `e2e/pages/`. They encapsulate page-specific logic and locators.

#### Example Page Object

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run Vitest in watch mode |
| `npm run test:unit` | Run all unit tests once |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:unit:ui` | Run unit tests with Vitest UI |
| `npm run test:unit:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:e2e:codegen` | Generate E2E test code |
| `npm run test:e2e:report` | Show Playwright test report |
| `npm run test:all` | Run all tests (unit + E2E) |

## Best Practices

### Unit Tests

1. **Use descriptive test names** - Follow the pattern "should [expected behavior] when [condition]"
2. **Arrange-Act-Assert** - Structure tests with clear setup, execution, and assertion phases
3. **Test one thing at a time** - Each test should verify a single behavior
4. **Use test doubles wisely** - Prefer spies over mocks when you only need to verify interactions
5. **Keep tests independent** - Tests should not depend on each other
6. **Mock external dependencies** - Database calls, API requests, etc.

### E2E Tests

1. **Use Page Object Model** - Encapsulate page-specific logic in page objects
2. **Use semantic locators** - Prefer `getByRole`, `getByLabel` over CSS selectors
3. **Wait for elements** - Use Playwright's auto-waiting features
4. **Test user flows** - Focus on critical user journeys
5. **Isolate test data** - Use fixtures and setup/teardown hooks
6. **Keep tests maintainable** - Use descriptive names and comments

### Coverage

- Aim for >80% coverage for core business logic
- Focus on meaningful tests rather than arbitrary coverage percentages
- Use coverage reports to identify untested code paths

### CI/CD

- Unit tests run on every commit
- E2E tests run before deployment
- Coverage reports are generated and tracked
- Failed tests block deployment

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)

