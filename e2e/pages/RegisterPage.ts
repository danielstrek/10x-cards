import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Register Page
 */
export class RegisterPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordToggle: Locator;
  readonly confirmPasswordToggle: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorNotification: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using test IDs
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.passwordToggle = page.getByTestId('register-password-toggle');
    this.confirmPasswordToggle = page.getByTestId('register-confirm-password-toggle');
    this.submitButton = page.getByTestId('register-submit-button');
    this.loginLink = page.getByTestId('register-login-link');
    this.errorNotification = page.getByTestId('register-error-notification');
    this.successMessage = page.getByText(/rejestracja zakończona/i);
  }

  /**
   * Navigate to register page
   */
  async navigate(): Promise<void> {
    await this.goto('/auth/register');
    await this.waitForPageLoad();
  }

  /**
   * Fill registration form
   */
  async fillForm(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword || password);
  }

  /**
   * Submit registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<void> {
    await this.fillForm(email, password);
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
   * Check if registration was successful
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    return await this.successMessage.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if password validation error is shown
   */
  async hasPasswordValidationError(): Promise<boolean> {
    const errorText = this.page.getByText(/hasło musi/i);
    return await errorText.first().isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get password validation errors
   */
  async getPasswordValidationErrors(): Promise<string[]> {
    const errors = await this.page.locator('p.text-xs.text-destructive').allTextContents();
    return errors;
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Click on login link
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }
}

