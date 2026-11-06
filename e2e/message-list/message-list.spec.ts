import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  SECONDARY_USER,
} from '../helpers';

/** The open chat's scroll container. */
const container = (page: Page) => page.locator('cometchat-messages cometchat-message-list .cometchat-message-list__container').first();
const scrollToBottomButton = (page: Page) => page.locator('cometchat-messages .cometchat-message-list__scroll-to-bottom');

/** Open the secondary user's chat (global setup seeds it with 50 messages) at its latest message. */
async function openSeededChat(page: Page) {
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
}

/**
 * E2E Tests — CometChatMessageList (Angular)
 *
 * Tests the message list component. Requires opening a conversation first.
 *
 * @see ENG-34936
 */

test.describe('CometChatMessageList', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    // Open the first conversation. A click straight after the list renders can be lost while
    // the list is still updating, so openConversation retries until the header shows it.
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    const firstName = (await page.locator('.cometchat-conversation-item__title-text').first().textContent())?.trim() ?? '';
    await openConversation(page, firstName);
    // Wait for message list to render
    await page.waitForSelector('cometchat-message-list, .cometchat-message-list', { timeout: 15_000 });
  });

  // ==================== Rendering ====================

  
  
  
  // ==================== Message Alignment ====================

  
  
  // ==================== Date Separators ====================

  
  // ==================== Scroll Behavior ====================

  
  test('clicking scroll to bottom button scrolls to latest message @quarantine (ENG-40795)', async () => {
    // @quarantine (ENG-40795): intermittent UI Kit defect. Jumping to the latest message from
    // the top of a long chat, while older pages are still loading, sometimes stops mid-way and
    // leaves the button on screen: both attempts failed in one CI run, 1 of 5 locally.
    await openSeededChat(page);
    await container(page).evaluate((el) => el.scrollTo({ top: 0 }));
    await expect(scrollToBottomButton(page)).toBeVisible({ timeout: 10_000 });

    await scrollToBottomButton(page).locator('cometchat-button').click();
    await expect
      .poll(() => container(page).evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 50), { timeout: 15_000 })
      .toBe(true);
    await expect(scrollToBottomButton(page)).toBeHidden();
  });

  // ==================== Message Actions ====================

  test('hovering a message shows action menu', async () => {
    await openSeededChat(page);
    const row = page.locator('cometchat-messages .cometchat-message-list__message').last();
    const options = row.locator('.cometchat-message-bubble__options');
    await expect(async () => {
      await row.locator('.cometchat-message-bubble__body').first().hover();
      await expect(options).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(options.getByRole('button', { name: 'More options' })).toBeVisible();
  });

  
  // ==================== Reactions ====================

  
  // ==================== Message Types ====================

  
  
  // ==================== Receipts ====================

  
  // ==================== Accessibility ====================

  test('message list has proper ARIA structure', async () => {
    const list = page.locator('cometchat-message-list').first();
    await expect(list).toBeVisible();

    // Messages should have accessible structure
    await expect(list.locator('[aria-label], [role]').first()).toBeVisible({ timeout: 3_000 });
  });

  // ==================== Pagination ====================

  
});
