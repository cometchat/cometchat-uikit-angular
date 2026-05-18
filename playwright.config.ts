import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env if present — optional override for CI or alternate environments.
// By default, credentials come from projects/sample-app/src/environments/environment.ts
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright E2E Configuration for CometChat Angular UIKit
 *
 * Tests run against the sample-app (ng serve sample-app) which demonstrates
 * all UIKit components in a real Angular application.
 *
 * Usage:
 *   npx playwright test                    # Run all E2E tests
 *   npx playwright test --project=chromium # Run in Chrome only
 *   npx playwright test e2e/conversations  # Run specific test file
 *   npx playwright test --ui               # Open Playwright UI mode
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential — tests share CometChat state
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1, // Single worker — CometChat SDK is stateful
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  timeout: 60_000, // 60s per test (network calls to CometChat)
  expect: {
    timeout: 10_000, // 10s for assertions (SDK responses)
  },

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Angular dev server before running tests */
  webServer: {
    command: 'npx ng serve sample-app --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000, // 2 min for Angular build
  },
});
