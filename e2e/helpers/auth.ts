import { Page, expect } from '@playwright/test';
import { environment } from '../../projects/sample-app/src/environments/environment';
import { E2E_ISOLATED } from './run';
import { PRIMARY_USER } from './seed';

/**
 * E2E Authentication Helper
 *
 * Handles login to the CometChat sample app.
 *
 * Environment variables (set in .env):
 *   E2E_APP_ID    — CometChat App ID of the E2E app
 *   E2E_REGION    — CometChat Region (us)
 *   E2E_AUTH_KEY  — CometChat Auth Key
 *   E2E_USER_UID  — Who loginToApp logs in as by default (cometchat-uid-1). Ignored in an
 *                   isolated run (E2E_RUN_ID set), which logs in as its own PRIMARY_USER.
 */

export interface AuthConfig {
  appId: string;
  region: string;
  authKey: string;
  userUid: string;
}

/**
 * The sample users the login page offers as cards. An isolated run logs in as its own users
 * (PRIMARY_USER etc. in ./seed.ts); use these only to exercise the cards themselves.
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
  // An isolated run's users are its own; a shared E2E_USER_UID (CI sets one) would undo that.
  const userUid = E2E_ISOLATED ? PRIMARY_USER : process.env['E2E_USER_UID'] || environment.userUid;

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
 * 4. Click the sample user's card, or for a user the run created (e2e-…, not on the cards)
 *    enter its UID
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
  const errorAlert = page.locator('.cometchat-login__error');
  // isVisible() answers at once (it has no wait); a later error is caught after the user click.
  const hasError = await errorAlert.isVisible();
  if (hasError) {
    const errorText = await errorAlert.textContent();
    throw new Error(`CometChat login failed: ${errorText?.trim()}. Check your E2E_APP_ID and E2E_AUTH_KEY in .env`);
  }

  const targetUid = auth.userUid;
  if (targetUid.startsWith('e2e-')) {
    // A user this run created: the cards only offer the sample users, so log in by UID.
    await page.locator('#customUid').fill(targetUid);
    await page.locator('.cometchat-login__submit-button').click();
  } else {
    await clickSampleUser(page, targetUid);
  }

  // Wait for whichever appears first — home or the login page's error — then check which.
  // (A race of two waitForSelector calls left the losing wait pending, shown red in traces.)
  const home = page.locator('.cometchat-conversations, cometchat-conversations, .cometchat-home').first();
  const loginError = page.locator('.cometchat-login__error');
  await expect(home.or(loginError)).toBeVisible({ timeout: 60_000 });
  if (await loginError.isVisible()) {
    throw new Error(`CometChat login failed after user click: ${(await loginError.textContent())?.trim()}`);
  }
}

/** Click the login page's card for sample user `targetUid`, or the first card if it has none. */
async function clickSampleUser(page: Page, targetUid: string): Promise<void> {
  const userByUid = page.locator(`.cometchat-login__user[data-uid="${targetUid}"], .cometchat-login__user:has-text("${targetUid}")`).first();
  // Wait for the cards to render before deciding: checking at once could pick the first card
  // while the target's card was still loading, and log in as the wrong user.
  await page.locator('.cometchat-login__user').first().waitFor({ state: 'visible', timeout: 10_000 });
  const hasTargetUser = (await userByUid.count()) > 0;

  // No silent fallback to another card: logging in as the wrong user makes every later
  // assertion about "my" messages wrong in confusing ways.
  if (!hasTargetUser) {
    throw new Error(`The login page has no sample-user card for "${targetUid}"; check E2E_USER_UID or use an e2e- user.`);
  }
  await userByUid.click();
}
