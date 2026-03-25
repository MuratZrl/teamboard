import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').getByText('TeamBoard')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started Free' }).first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('should register a new user and redirect', async ({ page }) => {
    const unique = Date.now();

    // Listen to API calls to debug registration
    const responses: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/auth/') || res.url().includes('/callback/')) {
        responses.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/register');
    await page.fill('input[id="name"]', `TestUser${unique}`);
    await page.fill('input[id="email"]', `test-${unique}@example.com`);
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait a bit for the request to complete
    await page.waitForTimeout(5000);

    // Check if there's an error displayed
    const errorEl = page.locator('.bg-red-50, [class*="red-500"]');
    const hasError = await errorEl.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorEl.textContent();
      console.log('Registration error:', errorText);
      console.log('API responses:', responses);
    }

    // Should redirect to workspaces
    await expect(page).toHaveURL(/\/workspaces/, { timeout: 20000 });
  });

  test('should show forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Reset your password')).toBeVisible();
  });

  test('should show password mismatch error on register', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[id="name"]', 'Mismatch User');
    await page.fill('input[id="email"]', 'mismatch@example.com');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword!');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});
