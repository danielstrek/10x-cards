import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Home Page
 */
export class HomePage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly generateButton: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.heading = page.locator("h1").first();
    this.generateButton = page.getByRole("link", { name: /generate|create/i });
    this.loginButton = page.getByRole("link", { name: /login|sign in/i });
  }

  /**
   * Navigate to home page
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Click on generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Click on login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const userNav = this.page.locator('[data-testid="user-nav"]');
      return await userNav.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }
}
