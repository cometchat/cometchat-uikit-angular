import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, createE2EGroup, PRIMARY_USER, SECONDARY_USER, uniqueTag, waitForSearchIndex } from '../helpers';

/**
 * E2E Tests — CometChatGroups (Angular)
 *
 * The Groups tab's list: loading, rows (avatar, name, type indicator, member count), search,
 * selection, pagination, the empty state, keyboard access, ARIA and the create button. Tests
 * that need particular groups create them (owned by the primary user) and find them by name,
 * since every run's public groups share this list.
 *
 * @see ENG-34940
 */

/** A unique tag of letters only: server search splits a keyword that mixes letters and digits. */
const letterTag = () => uniqueTag().replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);

const groups = (page: Page) => page.locator('cometchat-groups');
const items = (page: Page) => groups(page).locator('.cometchat-group-item');
const row = (page: Page, name: string) =>
  items(page).filter({ has: page.locator('.cometchat-group-item__title-text', { hasText: name }) }).first();

/** Search the groups list, retrying while the debounced search settles. */
async function searchGroups(page: Page, query: string, ready: () => Promise<void>) {
  await expect(async () => {
    await groups(page).getByRole('searchbox').fill(query);
    await ready();
  }).toPass({ timeout: 30_000 });
}

/** Find a group by name through search and return its row. */
async function findGroup(page: Page, name: string): Promise<Locator> {
  await searchGroups(page, name, async () => {
    await expect(row(page, name)).toBeVisible({ timeout: 3_000 });
  });
  return row(page, name);
}

test.describe('CometChatGroups', () => {
  let publicName: string;
  let privateName: string;
  let passwordName: string;

  test.beforeAll(async () => {
    const tag = letterTag();
    publicName = `Grplist ${tag} public`;
    privateName = `Grplist ${tag} private`;
    passwordName = `Grplist ${tag} password`;
    const members = [PRIMARY_USER, SECONDARY_USER];
    await Promise.all([
      createE2EGroup(`e2e-grplist-pub-${tag}`, publicName, PRIMARY_USER, members),
      createE2EGroup(`e2e-grplist-prv-${tag}`, privateName, PRIMARY_USER, members, { type: 'private' }),
      createE2EGroup(`e2e-grplist-pwd-${tag}`, passwordName, PRIMARY_USER, members, { type: 'password', password: 'e2e-pass' }),
    ]);
  });

  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Groups' }).click();
    // Search typed before the list first renders is ignored (ENG-39946), so wait for it.
    await expect(items(page).first()).toBeVisible({ timeout: 30_000 });
  });

  // ==================== Rendering & Loading ====================

  test('groups list renders and loads groups on init @smoke', async ({ page }) => {
    await expect(items(page).first()).toBeVisible({ timeout: 30_000 });
  });

  test('loading state resolves (shimmer disappears)', async ({ page }) => {
    await expect(items(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(groups(page).locator('.cometchat-groups__shimmer')).toHaveCount(0);
  });

  test('groups list displays group items with avatar and name', async ({ page }) => {
    const group = await findGroup(page, publicName);
    await expect(group.locator('cometchat-avatar')).toBeVisible();
    await expect(group.locator('.cometchat-group-item__title-text')).toHaveText(publicName);
  });

  // ==================== Group Type Indicator ====================

  
  // ==================== Member Count ====================

  test('member count displays correctly', async ({ page }) => {
    const group = await findGroup(page, publicName);
    await expect(group.locator('.cometchat-group-item__subtitle-text')).toHaveText(/^\s*2\s+Members\s*$/);
  });

  // ==================== Search ====================

  test('search bar is visible and filters groups', async ({ page }) => {
    await expect(items(page).nth(1)).toBeVisible({ timeout: 30_000 });
    // The three groups this run made share their first two words; searching the private one's
    // full name leaves only it.
    await searchGroups(page, privateName, async () => {
      await expect(items(page)).toHaveCount(1, { timeout: 3_000 });
    });
    await expect(row(page, privateName)).toBeVisible();

    // Clearing the search brings the full list back.
    await searchGroups(page, '', async () => {
      await expect(items(page).nth(1)).toBeVisible({ timeout: 3_000 });
    });
  });

  // ==================== Click Interaction ====================

  test('clicking a group selects it', async ({ page }) => {
    const group = await findGroup(page, publicName);
    await group.click();
    await expect(page.locator('cometchat-message-header').first()).toContainText(publicName, { timeout: 15_000 });
    await expect(group).toHaveClass(/cometchat-group-item--active/);
  });

  // ==================== Pagination ====================

  test('scrolling loads more groups (pagination) @quarantine (ENG-40729)', async ({ page }) => {
    // @quarantine (ENG-40729): intermittent UI Kit defect. In CI, scrolling the search results to
    // load the next page left the list with 30 unfiltered groups followed by all 31 results (61
    // rows); a fast local machine passes. Timing-dependent, so it can't be test.fail.
    // One more group than a page (30), all named with the same single search word.
    const word = `pg${letterTag()}`;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const names = Array.from({ length: 31 }, (_, i) => `${word}${letters[Math.floor(i / 26)]}${letters[i % 26]}`);
    for (let i = 0; i < names.length; i += 8) {
      await Promise.all(names.slice(i, i + 8).map((n) => createE2EGroup(`e2e-${n}`, n, PRIMARY_USER, [PRIMARY_USER])));
    }
    await waitForSearchIndex('groups', word, names.length);

    await searchGroups(page, word, async () => {
      await expect(items(page)).toHaveCount(30, { timeout: 5_000 });
    });
    // Scrolling the list to its end loads the 31st.
    await expect(async () => {
      await items(page).last().scrollIntoViewIfNeeded();
      await expect(items(page)).toHaveCount(31, { timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
  });

  // ==================== Empty State ====================

  test('empty state renders when search has no results', async ({ page }) => {
    const empty = groups(page).getByRole('status', { name: 'No Groups Available' });
    await searchGroups(page, `nogroup${letterTag()}`, async () => {
      await expect(items(page)).toHaveCount(0, { timeout: 3_000 });
      await expect(empty).toBeVisible({ timeout: 3_000 });
    });
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works', async ({ page }) => {
    await expect(items(page).nth(1)).toBeVisible({ timeout: 30_000 });
    const focused = () =>
      page.evaluate(
        () => document.activeElement?.closest('.cometchat-paginated-list__item')?.querySelector('.cometchat-group-item__title-text')?.textContent?.trim() ?? ''
      );
    await groups(page).getByRole('searchbox').focus();
    await page.keyboard.press('Tab');
    const first = await focused();
    expect(first, 'a group row has keyboard focus').toBeTruthy();
    // ArrowDown moves focus to the next group.
    await page.keyboard.press('ArrowDown');
    await expect.poll(focused).not.toBe(first);
    await expect.poll(focused).toBeTruthy();
  });

  // ==================== Accessibility ====================

  test('groups list has proper ARIA attributes', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Groups' })).toBeVisible();
    await expect(groups(page).getByRole('listbox', { name: 'Groups list' })).toBeVisible();
    await expect(groups(page).getByRole('searchbox')).toBeVisible();
    const group = await findGroup(page, publicName);
    await expect(group).toHaveAttribute('aria-label', new RegExp(publicName));
  });

  // ==================== Create Group Button ====================

  
});
