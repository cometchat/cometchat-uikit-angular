import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, getUserName, SECONDARY_USER, THIRD_USER } from '../helpers';

/**
 * E2E Tests — CometChatUsers (Angular)
 *
 * The Users tab's list: loading, rows (avatar, name, presence), search, selection, keyboard
 * focus and ARIA. Pagination, letter headers and the empty state are in users-behavior.spec.ts. Rows are found by the run's own
 * users' names, since every run's users share this list. Global setup keeps 30 shared filler
 * users, so the list is always longer than one page (30).
 *
 * @see ENG-34939
 */

const users = (page: Page) => page.locator('cometchat-users');
const items = (page: Page) => users(page).locator('.cometchat-user-item');
const row = (page: Page, name: string) =>
  items(page).filter({ has: page.locator('.cometchat-user-item__title-text', { hasText: name }) }).first();

/**
 * Type `query` in the users search box and wait for the list request it triggers (a search,
 * or the full list when `query` is empty) to be answered. Acting while a search is still
 * loading hits ENG-40633, which has its own test below.
 */
async function searchUsers(page: Page, query: string) {
  const answered = page.waitForResponse(
    (r) =>
      /\/users\?/.test(r.url()) &&
      (query ? r.url().includes(`searchKey=${encodeURIComponent(query)}`) : !r.url().includes('searchKey=')),
    { timeout: 30_000 }
  );
  await users(page).getByRole('searchbox').fill(query);
  await answered;
}

/** Find a user by name through search and return their row. */
async function findUser(page: Page, name: string): Promise<Locator> {
  await searchUsers(page, name);
  await expect(row(page, name)).toBeVisible();
  return row(page, name);
}

test.describe('CometChatUsers', () => {
  let secondaryName: string;
  let thirdName: string;

  test.beforeAll(async () => {
    [secondaryName, thirdName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(THIRD_USER)]);
  });

  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
    // Search typed before the list first renders is ignored (ENG-39946), so wait for it.
    await expect(items(page).first()).toBeVisible({ timeout: 30_000 });
  });

  // ==================== Rendering & Loading ====================

  test('users list renders and loads users on init @smoke', async ({ page }) => {
    await expect(items(page).nth(1)).toBeVisible();
    await expect(users(page).locator('.cometchat-users__shimmer')).toHaveCount(0);
  });

  test('users list displays user items with avatar and name', async ({ page }) => {
    const user = await findUser(page, secondaryName);
    await expect(user.locator('cometchat-avatar')).toBeVisible();
    await expect(user.locator('.cometchat-user-item__title-text')).toHaveText(secondaryName);
  });

  // ==================== Online/Offline Status ====================

  test('online/offline status indicator displays correctly', async ({ page, browser }) => {
    // Sign the secondary user in elsewhere, so they are online; the third user stays offline.
    const other = await browser.newContext();
    try {
      await loginToApp(await other.newPage(), { userUid: SECONDARY_USER });
      const online = await findUser(page, secondaryName);
      await expect(online.locator('.cometchat-user-item__status')).toHaveClass(/cometchat-user-item__status--online/, {
        timeout: 30_000,
      });
      const offline = await findUser(page, thirdName);
      await expect(offline.locator('.cometchat-user-item__status')).toHaveClass(/cometchat-user-item__status--offline/);
    } finally {
      await other.close();
    }
  });

  // ==================== Search ====================

  test('search bar is visible and functional', async ({ page }) => {
    // The run's third user can be found; searching the secondary user's name drops them.
    await findUser(page, thirdName);
    await findUser(page, secondaryName);
    await expect(row(page, thirdName)).toHaveCount(0);

    // Clearing the search brings the full list back.
    await searchUsers(page, '');
    await expect(items(page)).toHaveCount(30);
  });

  test('clearing the search while it is still loading restores the full list', async ({ page }) => {
    // Known UI Kit defect (ENG-40633): clearing the box while a search request is in flight sends
    // no request for the full list, and the late search response is shown under an empty box.
    // Expected to fail until fixed.
    test.fail();
    // Hold the search response until the box has been cleared.
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/users\?.*searchKey=/, async (route) => {
      await held;
      await route.continue();
    });
    const sent = page.waitForRequest(/\/users\?.*searchKey=/);
    await users(page).getByRole('searchbox').fill(secondaryName);
    await sent;
    await users(page).getByRole('searchbox').fill('');
    release();

    await expect(users(page).getByRole('searchbox')).toHaveValue('');
    await expect(items(page)).toHaveCount(30, { timeout: 10_000 });
  });

  // ==================== Click Interaction ====================

  test('clicking a user selects it', async ({ page }) => {
    const user = await findUser(page, secondaryName);
    await user.click();
    await expect(page.locator('cometchat-message-header').first()).toContainText(secondaryName, { timeout: 15_000 });
    await expect(user).toHaveClass(/cometchat-user-item--active/);
  });

  // ==================== Pagination ====================

  
  // ==================== Section Headers ====================

  
  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works', async ({ page }) => {
    const focused = () =>
      page.evaluate(
        () => document.activeElement?.closest('.cometchat-paginated-list__item')?.querySelector('.cometchat-user-item__title-text')?.textContent?.trim() ?? ''
      );
    await users(page).getByRole('searchbox').focus();
    await page.keyboard.press('Tab');
    const first = await focused();
    expect(first, 'a user row has keyboard focus').toBeTruthy();
    // ArrowDown moves focus to the next user.
    await page.keyboard.press('ArrowDown');
    await expect.poll(focused).not.toBe(first);
    await expect.poll(focused).toBeTruthy();
  });

  // ==================== Accessibility ====================

  test('users list has proper ARIA attributes', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Users', exact: true })).toBeVisible();
    await expect(users(page).getByRole('listbox', { name: 'Users list' })).toBeVisible();
    await expect(users(page).getByRole('searchbox')).toBeVisible();
    const user = await findUser(page, secondaryName);
    await expect(user).toHaveAttribute('aria-label', new RegExp(secondaryName));
  });

  
});
