import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

/**
 * Helper functions for authentication in E2E tests
 */

/**
 * Generate a unique email for testing
 */
export function generateUniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@10xcards-test.com`;
}

/**
 * Generate a strong password for testing
 */
export function generateStrongPassword(): string {
  return 'TestPassword123!@#';
}

/**
 * Register a new user and return credentials
 */
export async function registerNewUser(page: Page): Promise<{ email: string; password: string }> {
  const email = generateUniqueEmail();
  const password = generateStrongPassword();

  const registerPage = new RegisterPage(page);
  await registerPage.navigate();
  await registerPage.register(email, password);

  // Wait for auto-login redirect or success message
  await page.waitForTimeout(1000);

  return { email, password };
}

/**
 * Login with credentials
 */
export async function login(page: Page, email: string, password: string, rememberMe = false): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(email, password, rememberMe);
  
  // Wait for redirect
  await loginPage.waitForSuccessfulLogin();
}

/**
 * Register and login a new user
 */
export async function registerAndLogin(page: Page): Promise<{ email: string; password: string }> {
  const credentials = await registerNewUser(page);
  
  // Check if we're already logged in (auto-login after registration)
  const currentUrl = page.url();
  if (!currentUrl.includes('/generate') && !currentUrl.includes('/flashcards')) {
    // Need to login manually
    await login(page, credentials.email, credentials.password);
  }

  return credentials;
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Navigate to logout endpoint or click logout button
  // Adjust based on your app's logout implementation
  await page.goto('/api/auth/logout', { waitUntil: 'networkidle' });
  
  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Wait for redirect to login
  await page.waitForURL(/\/auth\/login/, { timeout: 5000 }).catch(() => {});
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Navigate to a page first if not already on one
  const url = page.url();
  if (!url || url === 'about:blank') {
    await page.goto('/');
  }

  // Check if we have tokens in storage
  const hasToken = await page.evaluate(() => {
    const localStorageToken = localStorage.getItem('sb-access-token');
    const sessionStorageToken = sessionStorage.getItem('sb-access-token');
    return !!(localStorageToken || sessionStorageToken);
  }).catch(() => false);

  return hasToken;
}

/**
 * Clear all authentication data
 */
export async function clearAuth(page: Page): Promise<void> {
  // Navigate to a page first if not already on one
  const url = page.url();
  if (!url || url === 'about:blank') {
    await page.goto('/');
  }

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => {
    // Ignore errors if storage is not accessible
  });

  // Clear cookies
  await page.context().clearCookies();
}

/**
 * Setup authenticated session for testing
 * This is faster than going through the UI
 */
export async function setupAuthenticatedSession(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  // Make API call to login
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to setup authenticated session: ${response.status()}`);
  }

  const data = await response.json();

  // Store tokens
  await page.evaluate((tokens) => {
    localStorage.setItem('sb-access-token', tokens.accessToken);
    localStorage.setItem('sb-refresh-token', tokens.refreshToken);
  }, data);
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(page: Page, timeout = 5000): Promise<void> {
  await page.waitForURL(/\/(generate|flashcards|study)/, { timeout });
}

/**
 * Verify user is on login page (not authenticated)
 */
export async function verifyNotAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return currentUrl.includes('/auth/login') || currentUrl.includes('/auth/register');
}

