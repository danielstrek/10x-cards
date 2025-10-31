import { test as base } from '@playwright/test';

/**
 * Test fixture for authentication
 * Extend this to create authenticated test contexts
 */
export const test = base.extend({
  // Add custom fixtures here
  authenticatedPage: async ({ page }, use) => {
    // TODO: Implement authentication logic
    // For now, just use the regular page
    await use(page);
  },
});

export { expect } from '@playwright/test';

