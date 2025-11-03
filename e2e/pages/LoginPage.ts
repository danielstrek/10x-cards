import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Login Page
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorNotification: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using test IDs
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.passwordToggle = page.getByTestId('login-password-toggle');
    this.rememberMeCheckbox = page.getByTestId('login-remember-me-checkbox');
    this.submitButton = page.getByTestId('login-submit-button');
    this.forgotPasswordLink = page.getByTestId('login-forgot-password-link');
    this.registerLink = page.getByTestId('login-register-link');
    this.errorNotification = page.getByTestId('login-error-notification');
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/auth/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill login form
   */
  async fillForm(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.fillForm(email, password, rememberMe);
    await this.submit();
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorNotification.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorNotification.textContent();
    }
    return null;
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Click on forgot password link
   */
  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click on register link
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Wait for successful login (redirect to generate page)
   */
  async waitForSuccessfulLogin(timeout = 5000): Promise<void> {
    await this.page.waitForURL(/\/generate/, { timeout });
  }
}

