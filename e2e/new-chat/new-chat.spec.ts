import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, createE2EUser, searchableTag, waitForSearchIndex } from '../helpers';

/**
 * E2E Tests — CometChatNewChat (Angular)
 *
 * The New Chat panel, opened from the conversations header menu ("Create conversation"):
 * its Users list, search, starting a chat, Back, and its ARIA structure.
 *
 * @see ENG-34988
 */

const header = (page: Page) => page.locator('cometchat-message-header').first();

/** Open New Chat from the conversations header menu and return the panel. */
async function openNewChat(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'CometChat Selector' }).click();
  await page.getByRole('menuitem', { name: 'Create conversation' }).click();
  const newChat = page.getByRole('region', { name: 'New Chat' });
  await expect(newChat).toBeVisible();
  return newChat;
}

/**
 * A user only this test can find by search. The server's search matches the pieces of a name, so
 * a run user's name ("Carol <run>-s2") also matches every other user of that run and of runs left
 * behind; New Chat shows the first 30 results alphabetically, and the user could fall off them.
 * A letters-only unique word (searchableTag) matches this user alone. Tagged as this run's E2E
 * data, so teardown deletes it.
 */
async function searchableUser(label: string): Promise<{ name: string; word: string }> {
  const tag = searchableTag();
  const word = tag[0].toUpperCase() + tag.slice(1);
  // User search matches the start of a name, so the name starts with the unique word.
  const name = `${word} ${label}`;
  await createE2EUser(`e2e-newchat-${tag}`, name);
  // New users reach the search index some seconds later, longer while the server is busy; wait
  // for it there. The tests that call this are marked slow, so the wait fits their time limit.
  await waitForSearchIndex('users', tag, 1, 90_000);
  return { name, word };
}

/** Search New Chat's Users list for `word`, retrying while the debounced search settles. */
async function searchUser(newChat: Locator, word: string, name: string): Promise<Locator> {
  const row = newChat.locator('cometchat-user-item').filter({ hasText: name });
  await expect(async () => {
    // Clear first, so every try sends a new search: typing the same text again changes nothing,
    // and a list load that lands after a search replaces its results.
    await newChat.getByRole('searchbox').fill('');
    await newChat.getByRole('searchbox').fill(word);
    await expect(row).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  return row;
}

test.describe('CometChatNewChat', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
    await expect(page.getByRole('button', { name: 'CometChat Selector' })).toBeVisible({ timeout: 30_000 });
  });

  // ==================== Opening New Chat ====================

  test('new chat dialog opens from conversations menu', async ({ page }) => {
    const newChat = await openNewChat(page);
    await expect(newChat).toContainText('New Chat');
    await expect(newChat.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(newChat.getByRole('tab', { name: 'Groups' })).toBeVisible();
  });

  // ==================== Users List ====================

  test('users list renders in new chat', async ({ page }) => {
    const newChat = await openNewChat(page);
    await newChat.getByRole('tab', { name: 'Users' }).click();
    await expect(newChat.getByRole('tab', { name: 'Users' })).toHaveAttribute('aria-selected', 'true');
    await expect(newChat.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
  });

  // ==================== Search ====================

  test('search filters users in new chat', async ({ page }) => {
    test.slow(); // creates users and waits for the search index
    const [wanted, other] = await Promise.all([searchableUser('Wanted'), searchableUser('Other')]);
    const newChat = await openNewChat(page);
    await newChat.getByRole('tab', { name: 'Users' }).click();
    await expect(newChat.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });

    // Searching for one user's word finds it; searching for the wanted user's word then keeps
    // the wanted user and drops the other.
    await searchUser(newChat, other.word, other.name);
    await searchUser(newChat, wanted.word, wanted.name);
    await expect(newChat.locator('cometchat-user-item').filter({ hasText: other.name })).toHaveCount(0);
  });

  // ==================== Click User ====================

  test('clicking a user starts a new conversation', async ({ page }) => {
    test.slow(); // creates a user and waits for the search index
    const { name, word } = await searchableUser('Newchat');
    const newChat = await openNewChat(page);
    await newChat.getByRole('tab', { name: 'Users' }).click();
    // Let the list load first, as the search test does: a first load that lands after the search
    // replaces its results.
    await expect(newChat.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
    const row = await searchUser(newChat, word, name);

    await row.click();
    await expect(newChat).toBeHidden();
    await expect(header(page)).toContainText(name, { timeout: 15_000 });
    await expect(page.locator('cometchat-messages cometchat-message-composer').first()).toBeVisible();
  });

  // ==================== Back Button ====================

  test('back button closes new chat', async ({ page }) => {
    const newChat = await openNewChat(page);
    await newChat.getByRole('button', { name: 'Back' }).click();
    await expect(newChat).toBeHidden();
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  // ==================== Accessibility ====================

  test('new chat component has proper ARIA attributes', async ({ page }) => {
    const newChat = await openNewChat(page);
    // A named region with a Back button, a tablist of Users and Groups, and a tab panel.
    await expect(newChat.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(newChat.getByRole('tablist')).toBeVisible();
    await expect(newChat.getByRole('tab')).toHaveCount(2);
    await expect(newChat.getByRole('tabpanel')).toBeVisible();
    await expect(newChat.getByRole('searchbox')).toBeVisible({ timeout: 30_000 });
  });
});
