# E2E Tests for 10x-cards

This directory contains end-to-end tests for the 10x-cards flashcard application using Playwright.

## Structure

```
e2e/
├── auth/                          # Authentication flow tests
│   ├── 01-registration-and-login.spec.ts
│   └── 04-logout-and-relogin.spec.ts
├── generation/                    # Flashcard generation tests
│   └── 02-generate-flashcards.spec.ts
├── flashcards/                    # Flashcard management tests
│   └── 03-manage-flashcards.spec.ts
├── fixtures/                      # Test fixtures
│   └── auth.fixture.ts           # Authentication fixtures
├── helpers/                       # Test helper functions
│   ├── auth.helper.ts            # Authentication helpers
│   └── test-data.helper.ts       # Test data generators
├── pages/                         # Page Object Model
│   ├── BasePage.ts               # Base page class
│   ├── RegisterPage.ts           # Register page
│   ├── LoginPage.ts              # Login page
│   ├── GeneratePage.ts           # Generate flashcards page
│   ├── FlashcardsPage.ts         # My flashcards page
│   └── HomePage.ts               # Home page
├── test-ids.md                    # Reference for test IDs
└── README.md                      # This file
```

## Test Scenarios

### Scenario 1: Registration and First Login
**File:** `auth/01-registration-and-login.spec.ts`

Tests cover:
- TC-AUTH-001: Successful user registration
- TC-AUTH-002: Weak password validation
- TC-AUTH-003: Password mismatch validation
- TC-AUTH-004: Successful login
- TC-AUTH-005: Invalid login credentials
- TC-AUTH-006: Protected page access without auth
- TC-AUTH-007: Remember me functionality
- TC-AUTH-008: Session storage vs local storage
- TC-AUTH-009: Email format validation
- TC-AUTH-010: Password visibility toggle

### Scenario 2: Generating Flashcards with AI
**File:** `generation/02-generate-flashcards.spec.ts`

Tests cover:
- TC-GEN-001: Successful flashcard generation (5-20 cards)
- TC-GEN-002: Text too short validation (< 1000 chars)
- TC-GEN-003: Text too long validation (> 10000 chars)
- TC-GEN-004: Generation from realistic study material
- TC-GEN-005: Accept individual flashcards
- TC-GEN-006: Edit flashcard before saving
- TC-GEN-007: Reject unwanted flashcards
- TC-GEN-008: Save only accepted flashcards
- TC-GEN-009: Save all flashcards at once
- TC-GEN-010: Handle generation errors gracefully
- TC-GEN-011: Clear previous results
- TC-GEN-012: Disable button during generation

### Scenario 3: Managing Flashcards
**File:** `flashcards/03-manage-flashcards.spec.ts`

Tests cover:
- TC-FLASH-001: Empty state display
- TC-FLASH-002: Create flashcard manually
- TC-FLASH-003: Display flashcards list
- TC-FLASH-004: Edit existing flashcard
- TC-FLASH-005: Delete flashcard
- TC-FLASH-006: Validate field lengths (front: 200, back: 500)
- TC-FLASH-007: Create multiple flashcards
- TC-FLASH-008: Cancel flashcard creation
- TC-FLASH-009: Correct total count
- TC-FLASH-010: Empty fields validation
- TC-FLASH-011: Data persistence after reload
- TC-FLASH-012: Multiple edits

### Scenario 4: Logout and Re-login
**File:** `auth/04-logout-and-relogin.spec.ts`

Tests cover:
- TC-LOGOUT-001: Successful logout
- TC-LOGOUT-002: Clear authentication data
- TC-LOGOUT-003: Redirect after logout
- TC-RELOGIN-001: Successful re-login
- TC-RELOGIN-002: Data persistence after re-login
- TC-RELOGIN-003: Generated flashcards persistence
- TC-RELOGIN-004: Separate data for different users (RLS)
- TC-RELOGIN-005: Rapid logout-login cycles
- TC-RELOGIN-006: Remember me preference
- TC-RELOGIN-007: Clear form data after logout

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Set up environment variables:
Create a `.env.test` file with:
```
BASE_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_key
```

4. Start the development server:
```bash
npm run dev
```

### Run All Tests

```bash
npm run test:e2e
```

Or with Playwright CLI:

```bash
npx playwright test
```

### Run Specific Test Suite

```bash
# Authentication tests
npx playwright test auth/

# Generation tests
npx playwright test generation/

# Flashcard management tests
npx playwright test flashcards/

# Specific test file
npx playwright test auth/01-registration-and-login.spec.ts
```

### Run Tests in UI Mode

```bash
npx playwright test --ui
```

### Run Tests in Headed Mode

```bash
npx playwright test --headed
```

### Run Tests in Specific Browser

```bash
# Chromium (default)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit
npx playwright test --project=webkit
```

### Debug Tests

```bash
npx playwright test --debug
```

Or debug specific test:

```bash
npx playwright test auth/01-registration-and-login.spec.ts --debug
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are generated in `playwright-report/` directory.

## Page Object Model (POM)

The tests use the Page Object Model pattern for better maintainability:

### BasePage
Base class for all page objects with common functionality:
- Navigation
- Page load waiting
- Screenshot capture
- Title retrieval

### RegisterPage
Methods for registration page:
- `navigate()` - Navigate to register page
- `fillForm(email, password, confirmPassword)` - Fill registration form
- `register(email, password)` - Complete registration
- `hasError()` - Check for errors
- `getPasswordValidationErrors()` - Get validation errors

### LoginPage
Methods for login page:
- `navigate()` - Navigate to login page
- `login(email, password, rememberMe)` - Complete login
- `hasError()` - Check for errors
- `togglePasswordVisibility()` - Toggle password field
- `waitForSuccessfulLogin()` - Wait for redirect

### GeneratePage
Methods for flashcard generation:
- `navigate()` - Navigate to generate page
- `generateFlashcards(text)` - Generate flashcards from text
- `acceptFlashcard(index)` - Accept a flashcard
- `editFlashcard(index, front, back)` - Edit a flashcard
- `rejectFlashcard(index)` - Reject a flashcard
- `clickSaveAll()` - Save all flashcards
- `clickSaveAccepted()` - Save only accepted

### FlashcardsPage
Methods for flashcard management:
- `navigate()` - Navigate to flashcards page
- `createFlashcard(front, back)` - Create new flashcard
- `editFlashcard(index, front, back)` - Edit flashcard
- `deleteFlashcard(index)` - Delete flashcard
- `getFlashcardsCount()` - Get number of flashcards

## Test Helpers

### auth.helper.ts
Authentication utilities:
- `generateUniqueEmail()` - Generate test email
- `generateStrongPassword()` - Generate valid password
- `registerNewUser(page)` - Register and return credentials
- `login(page, email, password)` - Login user
- `logout(page)` - Logout user
- `clearAuth(page)` - Clear all auth data
- `isAuthenticated(page)` - Check auth status

### test-data.helper.ts
Test data generation:
- `generateSampleText(length)` - Generate text (1000-10000 chars)
- `generateShortText()` - Text below minimum
- `generateLongText()` - Text above maximum
- `generateFlashcardData()` - Generate sample flashcard
- `generateStudyMaterialText()` - Realistic study content
- `generateInvalidFlashcard()` - Flashcard exceeding limits

## Test Fixtures

### auth.fixture.ts
Provides:
- `authenticatedPage` - Pre-authenticated browser page
- `userCredentials` - User credentials for testing

Usage:
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('My test', async ({ authenticatedPage }) => {
  // Page is already authenticated
  await authenticatedPage.goto('/generate');
  // ... test code
});
```

## Test IDs Reference

All interactive elements have `data-test-id` attributes for reliable test selectors.
See [test-ids.md](./test-ids.md) for complete reference.

Examples:
- `login-email-input` - Email field on login page
- `generate-flashcards-button` - Generate button
- `flashcard-card-edit-button` - Edit button on flashcard
- `save-accepted-button` - Save accepted flashcards button

## Best Practices

1. **Use Page Object Model** - Don't use selectors directly in tests
2. **Use test-ids** - Prefer `data-test-id` over CSS selectors
3. **Wait for elements** - Use `waitFor()` instead of fixed timeouts
4. **Clean up** - Use fixtures to ensure clean state
5. **Parallel execution** - Tests should be independent
6. **Meaningful names** - Test names should describe what they test
7. **Assertions** - Each test should have clear assertions

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run E2E tests
  run: |
    npm run build
    npm run test:e2e
```

## Troubleshooting

### Tests are flaky
- Increase timeouts in `playwright.config.ts`
- Add more specific waits in tests
- Check for race conditions

### Authentication issues
- Verify Supabase credentials in `.env.test`
- Check if email confirmation is disabled in Supabase
- Verify RLS policies are disabled for testing

### Generation tests fail
- Check OpenRouter API key is valid
- Verify API has sufficient credits
- Check rate limiting settings

### Flashcards not persisting
- Verify database connection
- Check RLS policies
- Verify user_id is correctly set

## Coverage Goals

Based on test plan:
- ✅ E2E tests: Minimum 15 scenarios (achieved: 40+ test cases)
- ✅ Critical user stories: US-001 to US-004 covered
- ✅ Authentication flow: Complete coverage
- ✅ Flashcard generation: Complete coverage
- ✅ Flashcard management: Complete coverage
- ✅ Data persistence: Verified across sessions

## Related Documentation

- [Test Plan](../.ai/test-plan-generated.mdc) - Complete test strategy
- [PRD](../.ai/prd.md) - Product requirements
- [API Plan](../.ai/api-plan.md) - API specifications
- [Playwright Docs](https://playwright.dev/docs/intro) - Playwright documentation
