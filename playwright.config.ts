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
// The sample app's port. Override with E2E_PORT when 4200 is taken (e.g. another app, or a
// second worktree running E2E at the same time).
const PORT = Number(process.env['E2E_PORT'] || 4200);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential — tests share CometChat state
  forbidOnly: !!process.env['CI'],
  // Quarantined tests (flaky, tagged @quarantine with a Linear issue in the title) are skipped by
  // smoke and full runs (E2E 4, ENG-40490). E2E_INCLUDE_QUARANTINE=1 runs them, e.g. to check a fix.
  grepInvert: process.env['E2E_INCLUDE_QUARANTINE'] ? undefined : /@quarantine/,
  retries: process.env['CI'] ? 1 : 0,
  workers: 1, // Single worker — CometChat SDK is stateful
  // CI writes a blob report per shard (merged later) and a JSON summary for the PR comment.
  reporter: process.env['CI']
    ? [['blob'], ['json', { outputFile: 'test-results/e2e-results.json' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 60_000, // 60s per test (network calls to CometChat)
  expect: {
    timeout: 10_000, // 10s for assertions (SDK responses)
  },

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: BASE_URL,
    trace: process.env['CI'] ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env['CI'] ? 'retain-on-failure' : 'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Serve the sample app. With E2E_STATIC_DIR set (CI), serve that production build, which is
     what customers ship; otherwise start the Angular dev server. */
  webServer: process.env['E2E_STATIC_DIR']
    ? {
        command: `node scripts/ci/serve-static.mjs ${process.env['E2E_STATIC_DIR']} ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 30_000,
      }
    : {
        command: `npx ng serve sample-app --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000, // 2 min for Angular build
      },
});
