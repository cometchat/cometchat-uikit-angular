import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  createE2EUser,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
  searchMessagesAs,
  searchableTag,
} from '../helpers';

/**
 * Message header and the details panels it opens: who you're talking to, their status,
 * call buttons, user/group details, and searching inside a conversation.
 * Every assertion waits on UI state.
 */

const header = (page: Page) => page.locator('cometchat-message-header');

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  const secondaryName = await getUserName(SECONDARY_USER);
  // Bring the chat to the top of Chats: chats other specs create can push it off the first page.
  await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Header check ${uniqueTag()}`);
  await loginToApp(page);
  await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  return secondaryName;
}

/** Create a fresh group with the primary and secondary users and open it. */
async function openFreshGroup(page: Page) {
  const runId = uniqueTag();
  const name = `E2E Header ${runId}`;
  await createE2EGroup(`e2e-header-${runId}`, name, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
  await loginToApp(page);
  await openConversation(page, name);
  return name;
}

/** Choose an item from the header's "More options" menu. */
async function headerMenu(page: Page, item: string) {
  await header(page).getByRole('button', { name: 'More options' }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

// ─── Header content ──────────────────────────────────────────────────────────

test.describe('Header', () => {
  test('a 1:1 header shows the name, avatar, status and call buttons', async ({ page, browser }) => {
    // The secondary user signs in elsewhere, so their status is known: Online.
    const other = await browser.newContext();
    try {
      await loginToApp(await other.newPage(), { userUid: SECONDARY_USER });
      const name = await openSecondaryChat(page);

      await expect(header(page).locator('.cometchat-message-header__title')).toHaveText(name);
      await expect(header(page).locator('cometchat-avatar').first()).toBeVisible();
      await expect(header(page).locator('.cometchat-message-header__subtitle-wrapper')).toHaveText(/^\s*Online\s*$/, {
        timeout: 15_000,
      });
      await expect(header(page).locator('cometchat-call-buttons').getByRole('button')).toHaveCount(2);
    } finally {
      await other.close();
    }
  });

  test('a 1:1 header shows "Offline" for a user who has never signed in', async ({ page }) => {
    // An offline user with no last-active time used to get an empty subtitle (ENG-40616).
    const runId = uniqueTag();
    const peer = { uid: `e2e-never-online-${runId}`, name: `E2E Never Online ${runId}` };
    await createE2EUser(peer.uid, peer.name);
    await sendTextAs(peer.uid, PRIMARY_USER, `Hello from ${peer.name}`);
    await loginToApp(page);
    await openConversation(page, peer.name);

    await expect(header(page).locator('.cometchat-message-header__title')).toHaveText(peer.name);
    await expect(header(page).locator('.cometchat-message-header__subtitle-wrapper')).toHaveText(/^\s*Offline\s*$/);
  });

  test("a group header shows the group name and how many members it has @smoke", async ({ page }) => {
    const name = await openFreshGroup(page);

    await expect(header(page).locator('.cometchat-message-header__title')).toHaveText(name);
    await expect(header(page).locator('.cometchat-message-header__subtitle-wrapper')).toHaveText(/2\s+Members/);
  });
});

// ─── Details panels ──────────────────────────────────────────────────────────

test.describe('Details', () => {
  test('clicking the 1:1 header opens user details; closing hides them', async ({ page }) => {
    const name = await openSecondaryChat(page);

    await header(page).locator('.cometchat-message-header__info').first().click();

    const details = page.locator('cometchat-user-details');
    await expect(details).toBeVisible();
    await expect(details).toContainText(name);
    await expect(details.getByText('Block User')).toBeVisible();
    await details.getByRole('button', { name: /close/i }).first().click();
    await expect(details).toBeHidden();
  });

  test('clicking a group header opens group details with its members', async ({ page }) => {
    const name = await openFreshGroup(page);
    const secondaryName = await getUserName(SECONDARY_USER);

    await header(page).locator('.cometchat-message-header__info').first().click();

    const details = page.locator('cometchat-group-details');
    await expect(details).toBeVisible();
    await expect(details).toContainText(name);
    await expect(details).toContainText(/2\s+Members/);
    await expect(details).toContainText(secondaryName);
  });
});

// ─── Search in a conversation ────────────────────────────────────────────────

test.describe('Search in a conversation', () => {
  test('searching finds a message in this chat, and clicking the result jumps to it', async ({ page }) => {
    // New messages reach the server's search index some time after they are sent, longer while
    // other runs are sending; the wait for the index below can take most of a minute in CI.
    test.setTimeout(120_000);
    const runId = uniqueTag();
    // Letters only: the server's search splits a word that mixes letters and digits.
    const needle = `needle${searchableTag()}`;
    // Push the target well up the conversation so jumping to it is observable. The fillers only
    // need to come after it, in any order, so they're sent together.
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Find the ${needle} in here`);
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => sendTextAs(SECONDARY_USER, PRIMARY_USER, `After ${i + 1} [${runId}]`))
    );
    await expect
      .poll(async () => (await searchMessagesAs(PRIMARY_USER, needle)).length, {
        message: 'the server search finds the message',
        timeout: 90_000,
      })
      .toBeGreaterThan(0);
    await openSecondaryChat(page);
    const target = page
      .locator('cometchat-messages cometchat-message-list .cometchat-message-list__message')
      .filter({ hasText: needle });

    await headerMenu(page, 'Search');
    const search = page.locator('cometchat-search').last();
    await expect(search).toBeVisible();
    const box = search.getByRole('searchbox');
    await expect(async () => {
      await box.fill(needle);
      await expect(search.locator('.cometchat-search__results')).toContainText(needle, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await search.locator('.cometchat-search__results').getByText(needle).first().click();

    await expect(target).toBeInViewport({ timeout: 15_000 });
    await expect(target).toHaveClass(/cometchat-message-list__message--highlighted/);
  });

  test('search inside a chat does not return messages from other chats', async ({ page }) => {
    const runId = uniqueTag();
    const elsewhere = `elsewhere-${runId}`;
    // Sent in a different conversation (third → primary user). Moderation blocks wording about
    // moving to "another chat" (rule: AI Platform Circumvention), so keep the text neutral.
    await sendTextAs(THIRD_USER, PRIMARY_USER, `Notes for the weekend: ${elsewhere}`);
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Notes for today: also-here-${runId}`);
    await openSecondaryChat(page);

    await headerMenu(page, 'Search');
    const search = page.locator('cometchat-search').last();
    const box = search.getByRole('searchbox');

    // Control: a message from this chat sent alongside it is found, so the search has run.
    await expect(async () => {
      await box.fill(`also-here-${runId}`);
      await expect(search.locator('.cometchat-search__results')).toContainText(`also-here-${runId}`, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await box.fill(elsewhere);
    await expect(search.locator('.cometchat-search__results').getByText(elsewhere)).toHaveCount(0, { timeout: 10_000 });
  });
});
