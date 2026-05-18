import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers';

/**
 * Smoke test — verifies the E2E setup works:
 * 1. Sample app loads
 * 2. Login flow completes
 * 3. Home page renders with conversations
 */
test.describe('Smoke Test', () => {
  test('should load the sample app and login successfully', async ({ page }) => {
    await loginToApp(page);

    // Verify the home page loaded
    await expect(page.locator('.cometchat-conversations').first()).toBeVisible();
  });
});
