import { test, expect } from '@playwright/test';

test.describe('Example E2E Test Suite', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page).toHaveTitle(/10x-cards/i);
  });

  test('should have visible navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Check if main content is visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should navigate to generate page', async ({ page }) => {
    await page.goto('/');
    
    // Look for a link or button to the generate page
    const generateLink = page.getByRole('link', { name: /generate|create/i });
    
    if (await generateLink.isVisible()) {
      await generateLink.click();
      await expect(page).toHaveURL(/\/generate/);
    }
  });
});

