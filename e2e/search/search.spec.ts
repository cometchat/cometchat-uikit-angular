import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, getUserName, SECONDARY_USER } from '../helpers';

/**
 * E2E Tests — CometChatSearch (Angular)
 *
 * The search component, opened from the Chats panel's search bar: its input, filters,
 * clicking a result, Back, the loading state, keyboard access and ARIA structure. Finding
 * conversations and messages and the no-results state are in search-behavior.spec.ts. Search is debounced and results arrive async, so every check waits on UI state.
 *
 * @see ENG-34942
 */

/** Open global search from the Chats panel's search bar. */
async function openSearch(page: Page): Promise<Locator> {
  await page.locator('cometchat-conversations').getByRole('searchbox').click();
  const search = page.locator('cometchat-search').first();
  await expect(search).toBeVisible();
  return search;
}

/** Type a keyword and wait until `ready` holds. */
async function searchFor(search: Locator, keyword: string, ready: () => Promise<void>) {
  await expect(async () => {
    await search.getByRole('searchbox').fill(keyword);
    await ready();
  }).toPass({ timeout: 30_000 });
}

const results = (search: Locator) => search.locator('.cometchat-search__results');

test.describe('CometChatSearch', () => {
  let page: Page;
  let search: Locator;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    search = await openSearch(page);
  });

  // ==================== Rendering ====================

  test('search component renders with input', async () => {
    await expect(search.getByRole('searchbox')).toBeVisible();
    await expect(search).toContainText('Start Your Search');
  });

  test('search input is focusable and accepts text', async () => {
    const box = search.getByRole('searchbox');
    await box.click();
    await expect(box).toBeFocused();
    await box.fill('hello');
    await expect(box).toHaveValue('hello');
  });

  // ==================== Search Triggers ====================

  
  // ==================== Filter Tabs ====================

  test('filter tabs are visible and switchable', async () => {
    const chips = search.locator('.cometchat-search__body-filter');
    await expect(chips.first()).toBeVisible();
    // A pressed chip moves to the front, so address it by its test id, not its position.
    const files = search.getByTestId('search-filter-files');
    await expect(files).toHaveAttribute('aria-pressed', 'false');

    await files.click();
    await expect(files).toHaveAttribute('aria-pressed', 'true');
    // Only one filter is on at a time.
    await expect(search.locator('.cometchat-search__body-filter[aria-pressed="true"]')).toHaveCount(1);
    await files.click();
    await expect(files).toHaveAttribute('aria-pressed', 'false');
  });

  // ==================== Conversations Results ====================

  
  // ==================== Messages Results ====================

  
  // ==================== Result Click ====================

  test('clicking a conversation result navigates to it', async () => {
    const name = await getUserName(SECONDARY_USER);
    const result = results(search).locator('.cometchat-conversation-item').filter({ hasText: name }).first();
    await searchFor(search, name, async () => {
      await expect(result).toBeVisible({ timeout: 5_000 });
    });
    await result.click();
    await expect(page.locator('cometchat-message-header').first()).toContainText(name, { timeout: 15_000 });
  });

  // ==================== Back Button ====================

  test('back button closes search', async () => {
    await search.getByRole('button', { name: 'Back' }).click();
    await expect(search).toBeHidden();
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  // ==================== Empty State ====================

  
  // ==================== Loading State ====================

  test('loading state shows during search', async () => {
    // Hold the search requests until the loading state has been seen, so it is checked
    // deterministically rather than caught in passing.
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(/searchKey=/, async (route) => {
      await held;
      await route.continue();
    });
    const name = await getUserName(SECONDARY_USER);
    await search.getByRole('searchbox').fill(name);

    const shimmers = search.locator('.cometchat-search__shimmer').filter({ visible: true });
    await expect(shimmers.first()).toBeVisible({ timeout: 10_000 });
    release();
    await expect(shimmers).toHaveCount(0, { timeout: 15_000 });
    await expect(results(search)).toContainText(name);
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation through results works', async () => {
    const name = await getUserName(SECONDARY_USER);
    const result = results(search).locator('.cometchat-conversation-item').filter({ hasText: name }).first();
    await searchFor(search, name, async () => {
      await expect(result).toBeVisible({ timeout: 5_000 });
    });

    // Tab from the search box until the result has focus, then open it with Enter.
    await search.getByRole('searchbox').focus();
    await expect(async () => {
      await page.keyboard.press('Tab');
      expect(await result.evaluate((el) => el.contains(document.activeElement) || el === document.activeElement)).toBe(true);
    }).toPass({ timeout: 10_000 });
    await page.keyboard.press('Enter');
    await expect(page.locator('cometchat-message-header').first()).toContainText(name, { timeout: 10_000 });
  });

  // ==================== Accessibility ====================

  test('search component has proper ARIA attributes', async () => {
    await expect(page.getByRole('search', { name: 'Search' })).toBeVisible();
    await expect(search.getByRole('searchbox')).toHaveAttribute('aria-label', /.+/);
    await expect(search.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(search.getByRole('toolbar')).toBeVisible();
  });
});
