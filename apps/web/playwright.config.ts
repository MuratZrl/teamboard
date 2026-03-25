import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'cd ../.. && pnpm dev:api',
          url: 'http://localhost:4000/api/auth/me',
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
        {
          command: 'cd ../.. && pnpm dev:web',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
      ],
});
