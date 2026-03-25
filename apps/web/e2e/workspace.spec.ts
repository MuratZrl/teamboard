import { test, expect } from '@playwright/test';

const unique = Date.now();
const TEST_USER = {
  name: `WsUser${unique}`,
  email: `ws-${unique}@example.com`,
  password: 'TestPassword123!',
};

// Shared helper: register via API directly, then login via UI
async function registerAndLogin(page: any) {
  // Register via API to ensure user exists
  await page.request.post('http://localhost:4000/api/auth/register', {
    data: { name: TEST_USER.name, email: TEST_USER.email, password: TEST_USER.password },
  });

  // Login via UI
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/workspaces/, { timeout: 20000 });
}

test.describe('Workspace Management', () => {
  test('should register and see workspaces page', async ({ page }) => {
    const u = Date.now();
    await page.goto('/register');
    await page.fill('input[id="name"]', `RegUser${u}`);
    await page.fill('input[id="email"]', `reg-${u}@example.com`);
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/workspaces/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible();
  });

  test('should login and see auto-created workspace', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page.getByText(`${TEST_USER.name}'s Workspace`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should create a board', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByText(`${TEST_USER.name}'s Workspace`).first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/workspaces\//, { timeout: 10000 });

    await page.getByText('New Board').click();
    await page.fill('input[placeholder="Board name"]', 'My Test Board');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(/\/boards\//, { timeout: 10000 });
    await expect(page.getByText('My Test Board')).toBeVisible();
  });
});
