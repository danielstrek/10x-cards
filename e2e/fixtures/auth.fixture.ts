import { test as base, Page } from '@playwright/test';
import { registerAndLogin, clearAuth } from '../helpers/auth.helper';

/**
 * Extended test context with authenticated user
 */
type AuthFixtures = {
  authenticatedPage: Page;
  userCredentials: { email: string; password: string };
};

/**
 * Test fixture for authentication
 * Provides an authenticated page and user credentials
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Fixture that provides a page with an authenticated user
   * Automatically registers a new user and logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    // Clear any existing auth data
    await clearAuth(page);

    // Register and login a new user
    await registerAndLogin(page);

    // Provide the authenticated page to the test
    await use(page);

    // Cleanup after test
    await clearAuth(page);
  },

  /**
   * Fixture that provides user credentials
   * Can be used independently or with authenticatedPage
   */
  userCredentials: async ({ page }, use) => {
    const credentials = {
      email: `test-${Date.now()}@10xcards-test.com`,
      password: 'TestPassword123!@#',
    };

    await use(credentials);
  },
});

export { expect } from '@playwright/test';

