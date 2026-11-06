import { test, expect, Page } from '../fixtures/coverage';
import { loginToApp, getUserName, createE2EUser, SECONDARY_USER, uniqueTag, searchableTag, waitForSearchIndex } from '../helpers';

/**
 * Users tab: ordering and letter headers, search, opening a chat, and pagination.
 * Global setup seeds 30 E2E users on top of the 5 sample users, so the list has more
 * than one page (30). Every assertion waits on UI state.
 */

const users = (page: Page) => page.locator('cometchat-users');
const userNames = (page: Page) => users(page).locator('.cometchat-user-item__title-text');

async function openUsersTab(page: Page) {
  await loginToApp(page);
  await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
  await expect(userNames(page).first()).toBeVisible({ timeout: 30_000 });
}

/** Search the users list, retrying while the debounced search settles. */
async function searchUsers(page: Page, query: string, ready: () => Promise<void>) {
  await expect(async () => {
    await users(page).getByRole('searchbox').fill(query);
    await ready();
  }).toPass({ timeout: 30_000 });
}

test.describe('Users list', () => {
  test('users are listed alphabetically under letter headers', async ({ page }) => {
    // Users of this test only, found by a letters-only tag: the whole list changes while other
    // runs sign in and out (they share the E2E app), so its order can't be asserted. User search
    // matches the start of a name, so every name starts with the tag and they share one header.
    const tag = searchableTag();
    const prefix = tag[0].toUpperCase() + tag.slice(1);
    const expected = [`${prefix} Alpha`, `${prefix} Bravo`, `${prefix} Bravo Junior`, `${prefix} Charlie`];
    for (const [i, name] of [...expected].reverse().entries()) await createE2EUser(`e2e-sort-${tag}-${i}`, name);
    await waitForSearchIndex('users', tag, expected.length);
    await openUsersTab(page);
    await searchUsers(page, tag, async () => {
      await expect(userNames(page)).toHaveCount(expected.length, { timeout: 3_000 });
    });

    expect((await userNames(page).allTextContents()).map((n) => n.trim())).toEqual(expected);

    // Every name sits under the header for its first letter.
    const misplaced = await users(page).evaluate((root) => {
      const bad: string[] = [];
      let letter = '';
      root.querySelectorAll('.cometchat-users__section-header, .cometchat-user-item__title-text').forEach((el) => {
        const text = (el.textContent ?? '').trim();
        if (el.classList.contains('cometchat-users__section-header')) letter = text.toUpperCase();
        else if (letter && text[0]?.toUpperCase() !== letter) bad.push(`${text} under ${letter}`);
      });
      return bad;
    });
    expect(misplaced).toEqual([]);
    await expect(users(page).locator('.cometchat-users__section-header')).toHaveText([prefix[0]]);
  });

  test('clicking a user opens a chat with them', async ({ page }) => {
    const name = await getUserName(SECONDARY_USER);
    await openUsersTab(page);

    await searchUsers(page, name, async () => {
      await expect(userNames(page).filter({ hasText: name })).toBeVisible({ timeout: 3_000 });
    });
    await userNames(page).filter({ hasText: name }).click();

    await expect(page.locator('cometchat-message-header')).toContainText(name, { timeout: 15_000 });
    await expect(page.locator('cometchat-message-composer')).toBeVisible();
  });

  test('scrolling past the first page loads more users without duplicates', async ({ page }) => {
    await openUsersTab(page);
    await expect(userNames(page)).toHaveCount(30, { timeout: 30_000 });

    await expect(async () => {
      await userNames(page).last().hover();
      await page.mouse.wheel(0, 2_000);
      expect(await userNames(page).count()).toBeGreaterThan(30);
    }).toPass({ timeout: 30_000 });

    const names = (await userNames(page).allTextContents()).map((n) => n.trim());
    expect(new Set(names).size).toBe(names.length);
  });
});

test.describe('Search', () => {
  test('search matches the start of a name, ignoring case @smoke', async ({ page }) => {
    // User search (server side) matches from the start of the name only: "e2e searchable"
    // finds "E2E Searchable …", but "Searchable" alone would not.
    const runId = uniqueTag();
    const name = `E2E Searchable ${runId}`;
    await createE2EUser(`e2e-searchable-${runId}`, name);
    await openUsersTab(page);

    await searchUsers(page, `e2e searchable ${runId}`, async () => {
      await expect(userNames(page)).toHaveCount(1, { timeout: 3_000 });
      await expect(userNames(page).first()).toHaveText(name);
    });
  });

  test('a search with no matches shows the empty state', async ({ page }) => {
    await openUsersTab(page);

    await searchUsers(page, `zz-no-user-${uniqueTag()}`, async () => {
      await expect(users(page).locator('.cometchat-users__empty-state-view')).toBeVisible({ timeout: 3_000 });
    });
    await expect(userNames(page)).toHaveCount(0);
  });

  test('a search typed before the list first renders still filters it', async ({ page }) => {
    // Known UI Kit defect (ENG-39946): text typed before the user list first renders is
    // ignored — no search request is sent, so the list stays unfiltered. Expected to fail
    // until fixed.
    test.fail();
    const name = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
    await users(page).getByRole('searchbox').fill(name); // immediately, before the list renders

    await expect(userNames(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(userNames(page)).toHaveCount(1, { timeout: 10_000 });
    await expect(userNames(page).first()).toHaveText(name);
  });
});
