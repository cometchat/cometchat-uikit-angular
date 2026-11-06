import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  conversationRow,
  openConversation,
  getUserName,
  sendTextAs,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
  searchableTag,
  waitForSearchIndex,
} from '../helpers';

/**
 * E2E Tests — Selection Modes (Conversations, Users, Groups)
 *
 * Which row a list marks as active when you open it, by click or keyboard, and what happens
 * to that selection when you switch tabs. Every test arranges its own chats or group over
 * REST and names the row it acts on: other runs' users and groups share these lists.
 */

const tab = (page: Page, name: string) => page.getByLabel('Navigation tabs').getByRole('tab', { name });
const header = (page: Page) => page.locator('cometchat-message-header').first();
const users = (page: Page) => page.locator('cometchat-users');
const groups = (page: Page) => page.locator('cometchat-groups');

/** The row in a Users or Groups list whose title is exactly `name`. */
function namedRow(list: Locator, itemClass: string, name: string): Locator {
  return list.locator(`.${itemClass}`).filter({ has: list.page().getByText(name, { exact: true }) }).first();
}

/** Search a Users or Groups list for `name`, retrying while the debounced search settles, and return its row. */
async function findRow(list: Locator, itemClass: string, name: string): Promise<Locator> {
  const row = namedRow(list, itemClass, name);
  // Let the first page load before searching: a search typed during it can mix that page into the
  // results (ENG-40729).
  await expect(list.locator(`.${itemClass}`).first()).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    await list.getByRole('searchbox').fill(name);
    await expect(row).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  return row;
}

/** Title of the list row that has keyboard focus ('' if none). */
const focusedRowTitle = (page: Page) =>
  page.evaluate(
    () =>
      document.activeElement
        ?.closest('.cometchat-paginated-list__item')
        ?.querySelector('.cometchat-user-item__title-text, .cometchat-group-item__title-text')
        ?.textContent?.trim() ?? ''
  );

/** Tab from a list's search box into its rows; returns the title of the row that has focus. */
async function tabIntoList(page: Page, list: Locator): Promise<string> {
  await list.getByRole('searchbox').focus();
  await page.keyboard.press('Tab');
  const title = await focusedRowTitle(page);
  expect(title, 'a list row has keyboard focus').toBeTruthy();
  return title;
}

test.describe('Selection Modes', () => {
  // ==================== Conversations Selection ====================

  test.describe('Conversations Tab', () => {
    test('conversation items are clickable and set active state', async ({ page }) => {
      await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Good morning ${uniqueTag()}`);
      await loginToApp(page);
      const name = await getUserName(SECONDARY_USER);

      await openConversation(page, name);
      await expect(conversationRow(page, name)).toHaveClass(/cometchat-conversation-item--active/);
      await expect(page.locator('.cometchat-conversation-item--active')).toHaveCount(1);
    });

    test('clicking different conversation changes active state', async ({ page }) => {
      await sendTextAs(SECONDARY_USER, PRIMARY_USER, `See you at lunch ${uniqueTag()}`);
      await sendTextAs(THIRD_USER, PRIMARY_USER, `Thanks for the notes ${uniqueTag()}`);
      await loginToApp(page);
      const [first, second] = await Promise.all([getUserName(SECONDARY_USER), getUserName(THIRD_USER)]);

      await openConversation(page, first);
      await expect(conversationRow(page, first)).toHaveClass(/--active/);
      await openConversation(page, second);

      // Only the chat opened last is active.
      await expect(conversationRow(page, second)).toHaveClass(/cometchat-conversation-item--active/);
      await expect(conversationRow(page, first)).not.toHaveClass(/--active/);
      await expect(page.locator('.cometchat-conversation-item--active')).toHaveCount(1);
    });
  });

  // ==================== Users Tab Selection ====================

  test.describe('Users Tab', () => {
    test.beforeEach(async ({ page }) => {
      await loginToApp(page);
      await tab(page, 'Users').click();
      await expect(users(page).getByRole('option').first()).toBeVisible({ timeout: 30_000 });
    });

    test('user items are clickable', async ({ page }) => {
      const name = await getUserName(SECONDARY_USER);
      const row = await findRow(users(page), 'cometchat-user-item', name);

      await row.click();
      await expect(header(page)).toContainText(name, { timeout: 15_000 });
      await expect(row).toHaveClass(/cometchat-user-item--active/);
    });

    test('users list supports keyboard selection', async ({ page }) => {
      // Known UI Kit defect (ENG-40631): ArrowDown moves focus, but Enter doesn't open the
      // focused user. Expected to fail until fixed.
      test.fail();
      await expect(users(page).getByRole('option').nth(1)).toBeVisible();
      const first = await tabIntoList(page, users(page));
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => focusedRowTitle(page), { message: 'ArrowDown moved focus to another user' }).not.toBe(first);
      const focused = await focusedRowTitle(page);
      await page.keyboard.press('Enter');
      await expect(header(page)).toContainText(focused, { timeout: 10_000 });
    });
  });

  // ==================== Groups Tab Selection ====================

  test.describe('Groups Tab', () => {
    test('group items are clickable', async ({ page }) => {
      // A group of the run's own user, so clicking it opens the chat (not a join prompt).
      // Letters only: the list's search must find exactly this group, not other runs' groups.
      const groupName = `E2E Selection ${searchableTag()}`;
      await createE2EGroup(`e2e-selection-${uniqueTag()}`, groupName, PRIMARY_USER, [PRIMARY_USER]);
      await waitForSearchIndex('groups', groupName, 1);
      await loginToApp(page);
      await tab(page, 'Groups').click();
      const row = await findRow(groups(page), 'cometchat-group-item', groupName);

      await row.click();
      await expect(header(page)).toContainText(groupName, { timeout: 15_000 });
      await expect(row).toHaveClass(/cometchat-group-item--active/);
    });

    test('groups list supports keyboard selection', async ({ page }) => {
      // Known UI Kit defect (ENG-40631): ArrowDown moves focus, but Enter doesn't open the
      // focused group. Expected to fail until fixed.
      test.fail();
      await loginToApp(page);
      await tab(page, 'Groups').click();
      await expect(groups(page).getByRole('option').nth(1)).toBeVisible({ timeout: 30_000 });
      const first = await tabIntoList(page, groups(page));
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => focusedRowTitle(page), { message: 'ArrowDown moved focus to another group' }).not.toBe(first);
      const focused = await focusedRowTitle(page);
      await page.keyboard.press('Enter');
      await expect(header(page)).toContainText(focused, { timeout: 10_000 });
    });
  });

  // ==================== Tab Switching ====================

  test('switching tabs preserves no selection conflicts', async ({ page }) => {
    // Plain text: moderation's "AI Platform Circumvention" rule once blocked "Talk soon <tag>".
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Good afternoon ${uniqueTag()}`);
    // Hold the chat's first page of messages, so the tabs change while it is still loading. A
    // load that finished after the chat was closed used to reopen it behind the other tab.
    await page.route(/\/v3\.0\/users\/[^/?]+\/messages\?/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await loginToApp(page);
    const name = await getUserName(SECONDARY_USER);
    await openConversation(page, name);
    await expect(conversationRow(page, name)).toHaveClass(/--active/);

    for (const [tabName, list] of [['Users', users(page)], ['Groups', groups(page)]] as const) {
      await tab(page, tabName).click();
      await expect(tab(page, tabName)).toHaveAttribute('aria-selected', 'true');
      await expect(list.getByRole('option').first()).toBeVisible({ timeout: 30_000 });
    }
    await tab(page, 'Chats').click();

    // Changing tabs closes the open chat, so no row stays selected and no chat is shown.
    await expect(conversationRow(page, name)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.cometchat-conversation-item--active')).toHaveCount(0);
    await expect(page.getByText('Welcome to your Conversations')).toBeVisible();
  });
});
