import { Page } from '@playwright/test';

/**
 * Base Page Object Model class
 * All page objects should extend this class
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }
}

