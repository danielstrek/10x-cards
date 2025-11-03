# E2E Test Examples

This document provides practical examples of running and working with E2E tests.

## Quick Start

### 1. Setup Environment

Create `.env.test` file:
```bash
cp .env .env.test
```

Edit `.env.test` with test-specific values:
```env
BASE_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your_local_anon_key
OPENROUTER_API_KEY=your_test_api_key
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Run Tests

```bash
npm run test:e2e
```

## Common Test Commands

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test file
```bash
npx playwright test auth/01-registration-and-login.spec.ts
```

### Run tests with specific tag/grep
```bash
npx playwright test --grep "TC-AUTH-001"
```

### Debug specific test
```bash
npm run test:e2e:debug auth/01-registration-and-login.spec.ts
```

### Generate test report
```bash
npm run test:e2e:report
```

## Running Tests by Scenario

### Scenario 1: Registration and Login
```bash
npx playwright test auth/01-registration-and-login.spec.ts
```

Expected: 10 tests, ~30 seconds

### Scenario 2: Generate Flashcards
```bash
npx playwright test generation/02-generate-flashcards.spec.ts
```

Expected: 12 tests, ~2-3 minutes (depends on AI API)

### Scenario 3: Manage Flashcards
```bash
npx playwright test flashcards/03-manage-flashcards.spec.ts
```

Expected: 12 tests, ~1-2 minutes

### Scenario 4: Logout and Re-login
```bash
npx playwright test auth/04-logout-and-relogin.spec.ts
```

Expected: 7 tests, ~1 minute

## Test Development Workflow

### 1. Generate test code (codegen)
```bash
npm run test:e2e:codegen http://localhost:3000
```

This opens a browser where you can interact with the app, and Playwright will generate test code.

### 2. Write test using Page Objects

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { GeneratePage } from '../pages/GeneratePage';

test('My new test', async ({ authenticatedPage }) => {
  const generatePage = new GeneratePage(authenticatedPage);
  
  await generatePage.navigate();
  await generatePage.fillSourceText('Sample text...');
  await generatePage.clickGenerate();
  
  expect(await generatePage.hasResults()).toBe(true);
});
```

### 3. Run test in debug mode
```bash
npx playwright test my-test.spec.ts --debug
```

### 4. View trace if test fails
```bash
npx playwright show-trace trace.zip
```

## Advanced Usage

### Run tests in parallel
```bash
npx playwright test --workers=4
```

### Run tests in specific browser
```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Run tests with screenshots
```bash
npx playwright test --screenshot=on
```

### Run tests with video recording
```bash
npx playwright test --video=on
```

### Retry failed tests
```bash
npx playwright test --retries=2
```

### Update snapshots
```bash
npx playwright test --update-snapshots
```

## CI/CD Examples

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Build app
        run: npm run build
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3001
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tips

### 1. Use `page.pause()` to pause execution
```typescript
test('Debug test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Opens Playwright Inspector
  // Test continues when you resume
});
```

### 2. Use `--headed` to see what's happening
```bash
npx playwright test --headed --slowmo=500
```

### 3. Take screenshots at specific points
```typescript
test('Screenshot test', async ({ page }) => {
  await page.goto('/generate');
  await page.screenshot({ path: 'screenshots/generate-page.png' });
});
```

### 4. Console logs
```typescript
test('Console logs', async ({ page }) => {
  page.on('console', msg => console.log('Browser log:', msg.text()));
  await page.goto('/');
});
```

### 5. Network requests
```typescript
test('Network monitoring', async ({ page }) => {
  page.on('request', request => 
    console.log('Request:', request.url())
  );
  page.on('response', response => 
    console.log('Response:', response.status(), response.url())
  );
  
  await page.goto('/');
});
```

## Common Issues and Solutions

### Issue: "Timeout waiting for element"

**Solution 1:** Increase timeout
```typescript
await element.waitFor({ timeout: 10000 });
```

**Solution 2:** Wait for network idle
```typescript
await page.waitForLoadState('networkidle');
```

**Solution 3:** Use better selector
```typescript
// Instead of:
await page.locator('button').click();

// Use test-id:
await page.getByTestId('generate-button').click();
```

### Issue: "Element is not visible"

**Solution:** Wait for visibility
```typescript
await element.waitFor({ state: 'visible' });
await element.click();
```

### Issue: "Tests are flaky"

**Solution 1:** Add explicit waits
```typescript
await page.waitForSelector('[data-test-id="results"]');
```

**Solution 2:** Retry assertions
```typescript
await expect(async () => {
  const count = await page.getByTestId('count').textContent();
  expect(count).toBe('5');
}).toPass({ timeout: 5000 });
```

**Solution 3:** Use auto-wait
```typescript
// Playwright auto-waits for these:
await page.getByTestId('button').click();
await expect(page.getByTestId('result')).toBeVisible();
```

### Issue: "Authentication fails in tests"

**Solution 1:** Check Supabase credentials
```bash
# Verify .env.test has correct values
cat .env.test
```

**Solution 2:** Disable email confirmation
```javascript
// In Supabase dashboard:
// Settings → Authentication → Email confirmations → Disable
```

**Solution 3:** Clear browser state
```typescript
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

## Performance Tips

### 1. Use fixtures for authentication
```typescript
// Instead of logging in in each test:
test('My test', async ({ authenticatedPage }) => {
  // Already logged in!
});
```

### 2. Run tests in parallel
```typescript
// In playwright.config.ts:
fullyParallel: true,
workers: 4,
```

### 3. Share context between tests (when safe)
```typescript
test.describe.configure({ mode: 'serial' });

test.describe('Serial tests', () => {
  test('Test 1', async ({ page }) => { /* ... */ });
  test('Test 2', async ({ page }) => { /* ... */ });
});
```

### 4. Use API for setup when possible
```typescript
test('Fast setup', async ({ page, request }) => {
  // Use API to create data
  await request.post('/api/flashcards', {
    data: { /* ... */ }
  });
  
  // Then test the UI
  await page.goto('/flashcards');
});
```

## Test Data Management

### Generate realistic test data
```typescript
import { generateSampleText } from '../helpers/test-data.helper';

test('With realistic data', async ({ authenticatedPage }) => {
  const text = generateSampleText(5000);
  // Use text in test
});
```

### Use unique identifiers
```typescript
import { generateUniqueEmail } from '../helpers/auth.helper';

test('With unique user', async ({ page }) => {
  const email = generateUniqueEmail('test-case-1');
  // Register with unique email
});
```

### Clean up test data (optional)
```typescript
test.afterEach(async ({ page, request }) => {
  // Delete test user's data
  await request.delete('/api/test/cleanup');
});
```

## Best Practices Checklist

- [ ] Use Page Object Model for better maintainability
- [ ] Use `data-test-id` attributes instead of CSS selectors
- [ ] Wait for elements instead of using fixed timeouts
- [ ] Use fixtures for common setup (authentication)
- [ ] Write independent tests that can run in any order
- [ ] Use meaningful test names (TC-XXX-NNN format)
- [ ] Add explicit assertions for expected outcomes
- [ ] Handle both success and error cases
- [ ] Test on multiple browsers when possible
- [ ] Keep tests fast and focused
- [ ] Clean up test data when needed
- [ ] Document complex test scenarios
- [ ] Review and update test-ids.md when adding new elements

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

