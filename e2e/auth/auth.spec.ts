import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  getAuthConfig,
  TEST_USERS,
  conversationRow,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * App shell & login: login, logout and switching user, session.
 * Tab navigation is already covered by full-journey and notification-feed.
 *
 * Every assertion waits on UI state; none of these tests sleep.
 */

async function openLoginPage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.cometchat-login__container')).toBeVisible({ timeout: 30_000 });
}

async function loginWithCustomUid(page: Page, uid: string): Promise<void> {
  await page.locator('#customUid').fill(uid);
  await page.locator('.cometchat-login__submit-button').click();
}

async function expectHome(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/home$/, { timeout: 60_000 });
  await expect(page.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
}

async function openSelectorMenu(page: Page) {
  await page.locator('.cometchat-selector__menu-button').click();
  const menu = page.locator('.cometchat-selector__context-menu');
  await expect(menu).toBeVisible();
  return menu;
}

async function expectLoggedInAs(page: Page, name: string): Promise<void> {
  const menu = await openSelectorMenu(page);
  await expect(menu.locator('.cometchat-selector__context-menu-user')).toHaveText(name);
  await page.keyboard.press('Escape');
}

async function logout(page: Page): Promise<void> {
  const menu = await openSelectorMenu(page);
  await menu.getByRole('menuitem', { name: 'Log Out' }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
  await expect(page.locator('.cometchat-login__container')).toBeVisible();
}

// ─── Login ───────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('full login: enter app credentials, pick a sample user, and land on home as that user @smoke', async ({ page }) => {
    const { appId, region, authKey } = getAuthConfig();
    // A sample user, as the cards offer only those (an isolated run's own users aren't on them).
    const sampleUser = TEST_USERS.user1;
    const userName = await getUserName(sampleUser);

    // 1. App credentials
    await page.goto('/credentials');
    const form = page.locator('.cometchat-credentials__form');
    await expect(form).toBeVisible({ timeout: 30_000 });
    await form.getByRole('radio', { name: new RegExp(`\\b${region}\\b`, 'i') }).click();
    await expect(form.getByRole('radio', { name: new RegExp(`\\b${region}\\b`, 'i') })).toHaveAttribute('aria-checked', 'true');
    await page.locator('#appId').fill(appId);
    await page.locator('#authKey').fill(authKey);
    await page.locator('.cometchat-credentials__button').click();

    // 2. Login page: pick the sample user by UID
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
    const userCard = page.locator('.cometchat-login__user').filter({ hasText: sampleUser });
    await expect(userCard).toBeVisible({ timeout: 30_000 });
    await userCard.click();

    // 3. Home, logged in as that user
    await expectHome(page);
    await expectLoggedInAs(page, userName);
  });

  test('custom UID logs in as that user', async ({ page }) => {
    const name = await getUserName(SECONDARY_USER);
    await openLoginPage(page);

    await loginWithCustomUid(page, SECONDARY_USER);

    await expectHome(page);
    await expectLoggedInAs(page, name);
  });

  test('empty custom UID shows a required error and stays on login', async ({ page }) => {
    await openLoginPage(page);

    await page.locator('.cometchat-login__submit-button').click();

    await expect(page.locator('.cometchat-login__error')).toHaveText('Please enter a UID.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('unknown UID shows login failed and stays on login', async ({ page }) => {
    await openLoginPage(page);

    await loginWithCustomUid(page, `e2e-no-such-user-${uniqueTag()}`);

    await expect(page.locator('.cometchat-login__error')).toHaveText('Login failed. Please try again.', {
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('"Change App Credentials" opens the credentials page', async ({ page }) => {
    await openLoginPage(page);

    await page.getByRole('link', { name: 'Change App Credentials' }).click();

    await expect(page).toHaveURL(/\/credentials$/);
    await expect(page.locator('.cometchat-credentials__form')).toBeVisible();
  });

  test('credentials page requires every field', async ({ page }) => {
    await page.goto('/credentials');
    await page.locator('#appId').fill('');
    await page.locator('#authKey').fill('');

    await page.locator('.cometchat-credentials__button').click();

    await expect(page.locator('.cometchat-credentials__error')).toHaveText('All fields are required.');
    await expect(page).toHaveURL(/\/credentials$/);
  });
});

// ─── Logout and switch user ──────────────────────────────────────────────────

test.describe('Logout and switch user', () => {
  test('logout returns to login and home is guarded afterwards @smoke', async ({ page }) => {
    await loginToApp(page);

    await logout(page);

    await page.goto('/home');
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
  });

  test("switching user in the same session shows only the new user's data", async ({ page }) => {
    const [primaryName, secondaryName] = await Promise.all([
      getUserName(PRIMARY_USER),
      getUserName(SECONDARY_USER),
    ]);
    await loginToApp(page, { userUid: PRIMARY_USER });
    await expectHome(page);
    await expect(conversationRow(page, secondaryName)).toBeVisible({ timeout: 30_000 });

    await logout(page);
    await loginWithCustomUid(page, SECONDARY_USER);

    await expectHome(page);
    await expectLoggedInAs(page, secondaryName);
    // Global setup seeds messages between the two users, so the new user sees the old one…
    await expect(conversationRow(page, primaryName)).toBeVisible({ timeout: 30_000 });
    // …and never a conversation with themself left over from the previous session.
    await expect(conversationRow(page, secondaryName)).toHaveCount(0);
  });

  test('a message received after logout and re-login renders exactly once @realtime @quarantine (ENG-40812)', async ({ page }) => {
    // @quarantine (ENG-40812): intermittent UI Kit defect — after logout and re-login in the same tab, live
    // events sometimes stop: a message sent over REST never reaches the app (neither the open
    // chat nor the Chats row updates). Failed 2 of 3 isolated runs, so it can't be test.fail.
    const secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page, { userUid: PRIMARY_USER });
    await expectHome(page);

    await logout(page);
    await loginWithCustomUid(page, PRIMARY_USER);
    await expectHome(page);
    const messageList = await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);

    const runId = uniqueTag();
    const first = `Listener check 1 [${runId}]`;
    const second = `Listener check 2 [${runId}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, first);
    await expect(messageList.getByText(first)).toBeVisible({ timeout: 30_000 });
    // A leaked listener from the first session would deliver `first` twice. Waiting for a
    // later message to arrive gives any duplicate time to land before counting.
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, second);
    await expect(messageList.getByText(second)).toBeVisible({ timeout: 30_000 });

    await expect(messageList.getByText(first)).toHaveCount(1);
    await expect(messageList.getByText(second)).toHaveCount(1);
  });
});

// ─── Session ─────────────────────────────────────────────────────────────────

test.describe('Session', () => {
  test('reload keeps the user logged in @smoke', async ({ page }) => {
    const primaryName = await getUserName(PRIMARY_USER);
    await loginToApp(page, { userUid: PRIMARY_USER });
    await expectHome(page);

    await page.reload();

    await expectHome(page);
    await expectLoggedInAs(page, primaryName);
  });

  test('a cleared session returns to login on reload', async ({ page }) => {
    await loginToApp(page);
    await expectHome(page);

    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
    await expect(page.locator('.cometchat-login__container')).toBeVisible();
  });
});
