import { test, expect } from '@playwright/test';

test.describe.serial('Kanban Board', () => {
  const unique = Date.now();
  const TEST_USER = {
    name: `KbUser${unique}`,
    email: `kb-${unique}@example.com`,
    password: 'TestPassword123!',
  };

  async function loginUser(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/workspaces/, { timeout: 20000 });
  }

  test('should register, create board, and see default columns', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('input[id="name"]', TEST_USER.name);
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.fill('input[id="confirmPassword"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/workspaces/, { timeout: 20000 });

    // Go to workspace
    await page.getByText(`${TEST_USER.name}'s Workspace`).first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/workspaces\//, { timeout: 10000 });

    // Create board
    await page.getByText('New Board').click();
    await page.fill('input[placeholder="Board name"]', 'Kanban Test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(/\/boards\//, { timeout: 10000 });

    // Verify default columns
    await expect(page.getByText('Todo').first()).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Review').first()).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should create a task', async ({ page }) => {
    await loginUser(page);

    // Navigate to workspace → board
    await page.getByText(`${TEST_USER.name}'s Workspace`).first().click({ timeout: 10000 });
    await page.getByText('Kanban Test').click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/boards\//, { timeout: 10000 });

    // Click + button on Todo column
    const todoHeader = page.locator('h3', { hasText: 'Todo' });
    const todoColumn = todoHeader.locator('..').locator('..');
    await todoColumn.locator('button').first().click();

    // Fill and add task
    await page.fill('input[placeholder="Task title..."]', 'My first task');
    await page.locator('button:text("Add")').click();

    await expect(page.getByText('My first task')).toBeVisible({ timeout: 10000 });
  });
});
