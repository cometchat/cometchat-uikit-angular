import { Page } from '@playwright/test';
import { environment } from '../../projects/sample-app/src/environments/environment';

/**
 * E2E Authentication Helper
 *
 * Handles login to the CometChat sample app.
 *
 * Environment variables (set in .env):
 *   E2E_APP_ID    — CometChat App ID (16787579c931f61e7)
 *   E2E_REGION    — CometChat Region (us)
 *   E2E_AUTH_KEY  — CometChat Auth Key
 *   E2E_USER_UID  — Primary test user (cometchat-uid-1)
 *   E2E_USER_UID_2 through E2E_USER_UID_5 — Additional test users
 */

export interface AuthConfig {
  appId: string;
  region: string;
  authKey: string;
  userUid: string;
}

/**
 * Available test users for E2E tests.
 */
export const TEST_USERS = {
  user1: 'cometchat-uid-1',
  user2: 'cometchat-uid-2',
  user3: 'cometchat-uid-3',
  user4: 'cometchat-uid-4',
  user5: 'cometchat-uid-5',
} as const;

/**
 * Get auth config from environment variables, falling back to environment.ts.
 * Environment variables take priority (for CI overrides).
 */
export function getAuthConfig(): AuthConfig {
  const appId = process.env['E2E_APP_ID'] || environment.appId;
  const region = process.env['E2E_REGION'] || environment.region;
  const authKey = process.env['E2E_AUTH_KEY'] || environment.authKey;
  const userUid = process.env['E2E_USER_UID'] || environment.userUid;

  if (!appId || !authKey) {
    throw new Error(
      'CometChat credentials are missing.\n' +
      'Set them in projects/sample-app/src/environments/environment.ts or in a .env file.'
    );
  }

  return { appId, region, authKey, userUid };
}

/**
 * Log in to the sample app.
 *
 * Flow:
 * 1. Navigate to the app (credentials page)
 * 2. Fill in App ID, Auth Key, select Region
 * 3. Submit → redirects to login page
 * 4. Click a sample user or enter custom UID
 * 5. Wait for the home page to load (conversations visible)
 */
export async function loginToApp(page: Page, config?: Partial<AuthConfig>): Promise<void> {
  const auth = { ...getAuthConfig(), ...config };

  // Navigate to the app and wait for it to fully load
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Clear any stale credentials from localStorage to ensure fresh login
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => {
    // Ignore if context was destroyed (e.g., redirect happened)
  });

  // Reload to start fresh from credentials page
  await page.reload();

  // Wait for either credentials page or login page to load
  await page.waitForSelector('.cometchat-credentials__form, .cometchat-login__container', {
    timeout: 20_000,
  });

  // If on credentials page, fill and submit
  const isCredentialsPage = await page.locator('.cometchat-credentials__form').isVisible().catch(() => false);

  if (isCredentialsPage) {
    // Fill App ID
    await page.locator('#appId').fill(auth.appId);

    // Fill Auth Key
    await page.locator('#authKey').fill(auth.authKey);

    // Select region (click the matching region radio)
    const regionSelector = `.cometchat-credentials__region:has-text("${auth.region.toUpperCase()}")`;
    const regionElement = page.locator(regionSelector).first();
    const hasRegion = await regionElement.isVisible().catch(() => false);
    if (hasRegion) {
      await regionElement.click();
    }

    // Submit credentials (Continue button)
    await page.locator('.cometchat-credentials__button').click();

    // Wait for login page
    await page.waitForSelector('.cometchat-login__container', {
      timeout: 30_000,
    });
  }

  // Check for error on login page (invalid credentials)
  const errorAlert = page.locator('.cometchat-login__error, [role="alert"]');
  const hasError = await errorAlert.isVisible({ timeout: 2_000 }).catch(() => false);
  if (hasError) {
    const errorText = await errorAlert.textContent();
    throw new Error(`CometChat login failed: ${errorText?.trim()}. Check your E2E_APP_ID and E2E_AUTH_KEY in .env`);
  }

  // Try to find a user matching the requested UID, or fall back to first user
  const targetUid = auth.userUid;
  const userByUid = page.locator(`.cometchat-login__user[data-uid="${targetUid}"], .cometchat-login__user:has-text("${targetUid}")`).first();
  const hasTargetUser = await userByUid.isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasTargetUser) {
    await userByUid.click();
  } else {
    // Fall back to first sample user
    const sampleUser = page.locator('.cometchat-login__user').first();
    await sampleUser.waitFor({ state: 'visible', timeout: 10_000 });
    await sampleUser.click();
  }

  // Wait for login to complete — either home page loads or error appears
  await Promise.race([
    page.waitForSelector('.cometchat-conversations, cometchat-conversations, .cometchat-home', { timeout: 60_000 }),
    page.waitForSelector('[role="alert"]', { timeout: 60_000 }).then(async () => {
      const errText = await page.locator('[role="alert"]').textContent();
      throw new Error(`CometChat login failed after user click: ${errText?.trim()}`);
    }),
  ]);
}
