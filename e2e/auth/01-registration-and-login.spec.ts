import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { 
  generateUniqueEmail, 
  generateStrongPassword,
  clearAuth,
} from '../helpers/auth.helper';

/**
 * E2E Tests for Scenario 1: Registration and First Login
 * 
 * Test Cases:
 * - TC-AUTH-001: Successful user registration
 * - TC-AUTH-002: Weak password validation
 * - TC-AUTH-003: Email already registered
 * - TC-AUTH-004: Successful login
 * - TC-AUTH-005: Invalid login credentials
 * - TC-AUTH-006: Access protected page without authentication
 */

test.describe('Scenario 1: Registration and First Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth data before each test
    await clearAuth(page);
  });

  test('TC-AUTH-001: Should successfully register a new user', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('register-test');
    const password = generateStrongPassword();

    // Navigate to register page
    await registerPage.navigate();

    // Fill and submit registration form
    await registerPage.fillForm(email, password);
    
    // Verify form is valid (no validation errors)
    const hasValidationError = await registerPage.hasPasswordValidationError();
    expect(hasValidationError).toBe(false);

    await registerPage.submit();

    // Wait for either success message or redirect to /generate
    const isSuccessful = await Promise.race([
      registerPage.isRegistrationSuccessful().then(result => ({ type: 'success', result })),
      page.waitForURL(/\/generate/, { timeout: 5000 }).then(() => ({ type: 'redirect', result: true })),
    ]).catch(() => ({ type: 'error', result: false }));

    // Assert that registration was successful
    expect(isSuccessful.result).toBe(true);

    // If auto-login is enabled, verify we're on /generate
    const currentUrl = page.url();
    const isOnProtectedPage = currentUrl.includes('/generate') || 
                               currentUrl.includes('/flashcards') ||
                               currentUrl.includes('/auth/register'); // Still on success screen

    expect(isOnProtectedPage).toBe(true);
  });

  test('TC-AUTH-002: Should reject weak password', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('weak-password');
    const weakPassword = '12345678'; // No uppercase, special char

    await registerPage.navigate();
    await registerPage.fillForm(email, weakPassword);

    // Check for client-side validation errors
    const validationErrors = await registerPage.getPasswordValidationErrors();
    expect(validationErrors.length).toBeGreaterThan(0);

    // Submit button should be disabled or show errors
    const submitButton = registerPage.submitButton;
    const isDisabled = await submitButton.isDisabled();
    
    // Either button is disabled or validation errors are shown
    const hasProperValidation = isDisabled || validationErrors.length > 0;
    expect(hasProperValidation).toBe(true);
  });

  test('TC-AUTH-003: Should reject registration with mismatched passwords', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('mismatch-password');
    const password = generateStrongPassword();
    const differentPassword = password + 'X';

    await registerPage.navigate();
    await registerPage.fillForm(email, password, differentPassword);

    // Check for password mismatch error
    const errorText = await page.getByText(/hasła nie są identyczne/i).textContent();
    expect(errorText).toContain('identyczne');

    // Submit button should be disabled
    const isDisabled = await registerPage.submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('TC-AUTH-004: Should successfully login with valid credentials', async ({ page }) => {
    // First, register a user
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('login-test');
    const password = generateStrongPassword();

    await registerPage.navigate();
    await registerPage.register(email, password);

    // Wait a bit for registration to complete
    await page.waitForTimeout(1000);

    // If we're already logged in, logout first
    await clearAuth(page);

    // Now try to login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(email, password);

    // Wait for redirect to /generate
    await loginPage.waitForSuccessfulLogin();

    // Verify we're on the generate page
    expect(page.url()).toContain('/generate');

    // Verify no error messages
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(false);
  });

  test('TC-AUTH-005: Should reject invalid login credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = generateUniqueEmail('nonexistent');
    const password = 'WrongPassword123!';

    await loginPage.navigate();
    await loginPage.login(email, password);

    // Wait a bit for error to appear
    await page.waitForTimeout(1000);

    // Verify error message is displayed
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage?.toLowerCase()).toMatch(/(nieprawidłowy|błąd|incorrect|invalid)/);

    // Verify we're still on login page
    expect(page.url()).toContain('/auth/login');
  });

  test('TC-AUTH-006: Should redirect to login when accessing protected page without auth', async ({ page }) => {
    // Try to access /generate without being logged in
    await page.goto('/generate');

    // Should be redirected to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

    expect(page.url()).toContain('/auth/login');
  });

  test('TC-AUTH-007: Should remember user when "Remember me" is checked', async ({ page }) => {
    // Register a user
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('remember-me');
    const password = generateStrongPassword();

    await registerPage.navigate();
    await registerPage.register(email, password);
    await page.waitForTimeout(1000);

    // Logout
    await clearAuth(page);

    // Login with "Remember me" checked
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(email, password, true);

    await loginPage.waitForSuccessfulLogin();

    // Verify tokens are in localStorage (not sessionStorage)
    const hasLocalStorageToken = await page.evaluate(() => {
      return !!localStorage.getItem('sb-access-token');
    });

    expect(hasLocalStorageToken).toBe(true);
  });

  test('TC-AUTH-008: Should use session storage when "Remember me" is not checked', async ({ page }) => {
    // Register a user
    const registerPage = new RegisterPage(page);
    const email = generateUniqueEmail('no-remember');
    const password = generateStrongPassword();

    await registerPage.navigate();
    await registerPage.register(email, password);
    await page.waitForTimeout(1000);

    // Logout
    await clearAuth(page);

    // Login WITHOUT "Remember me" checked
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(email, password, false);

    await loginPage.waitForSuccessfulLogin();

    // Verify tokens are in sessionStorage (not localStorage)
    const hasSessionStorageToken = await page.evaluate(() => {
      return !!sessionStorage.getItem('sb-access-token');
    });

    expect(hasSessionStorageToken).toBe(true);
  });

  test('TC-AUTH-009: Should validate email format', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const invalidEmail = 'not-an-email';
    const password = generateStrongPassword();

    await registerPage.navigate();
    await registerPage.fillForm(invalidEmail, password);

    // HTML5 validation should prevent submission
    const emailInput = registerPage.emailInput;
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    expect(validationMessage).toBeTruthy();
  });

  test('TC-AUTH-010: Should toggle password visibility', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.navigate();

    // Initially password should be hidden
    const passwordInput = registerPage.passwordInput;
    let inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');

    // Toggle visibility
    await registerPage.togglePasswordVisibility();

    // Password should now be visible
    inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('text');

    // Toggle back
    await registerPage.togglePasswordVisibility();

    // Password should be hidden again
    inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });
});

