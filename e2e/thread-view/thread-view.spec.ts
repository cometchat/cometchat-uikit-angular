import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — CometChatThreadHeader & Thread View (Angular)
 *
 * Tests the thread header and threaded messages functionality. Each test starts from a
 * message of its own in the seeded 1:1 chat that already has one thread reply (sent from
 * the thread's composer, as a user would: the REST API can't create thread replies), with
 * the thread closed again. Every assertion waits on UI state.
 *
 * @see ENG-34944
 */

const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const threadPanel = (page: Page) => page.locator('.cometchat-threaded-messages');
const threadHeader = (page: Page) => threadPanel(page).locator('cometchat-thread-header');
const threadList = (page: Page) => threadPanel(page).locator('cometchat-message-list');

/** The main-list row of the most recent message containing `text`. */
const mainRow = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

test.describe('CometChatThreadHeader & Thread View', () => {
  let page: Page;
  let parent: string;
  let reply: string;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    const runId = uniqueTag();
    parent = `Thread view parent ${runId}`;
    reply = `Thread view reply ${runId}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await loginToApp(page);
    await openConversation(page, await getUserName(SECONDARY_USER));
    await scrollToLatestMessage(page);

    // Start the thread from the message's menu and reply once. Wait for the thread's first
    // load before replying: a reply sent earlier may not show (ENG-39944).
    const row = mainRow(page, parent);
    await expect(row).toBeVisible({ timeout: 30_000 });
    const parentId = await row.getAttribute('data-message-id');
    const firstLoad = page.waitForResponse(
      (r) => r.request().method() === 'GET' && r.url().includes(`/messages/${parentId}/thread`),
      { timeout: 30_000 }
    );
    await row.locator('.cometchat-message-bubble__body').first().hover();
    await row.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Reply in thread' }).click();
    await expect(threadHeader(page)).toContainText(parent);
    await firstLoad;
    await threadPanel(page).locator('cometchat-message-composer [contenteditable="true"]').first().click();
    await page.keyboard.type(reply);
    await page.keyboard.press('Enter');
    await expect(threadList(page).getByText(reply)).toBeVisible({ timeout: 30_000 });
    await threadPanel(page).locator('.cometchat-thread-header__close-button').click();
    await expect(threadPanel(page)).toBeHidden();
  });

  /** Open the thread by clicking the parent's reply-count indicator. */
  async function openThreadFromReplyCount() {
    const indicator = mainRow(page, parent).locator('.cometchat-thread-view');
    await expect(indicator).toContainText('1', { timeout: 15_000 });
    await indicator.click();
    await expect(threadHeader(page)).toBeVisible();
  }

  // ==================== Opening Thread ====================

  
  // ==================== Thread Header ====================

  test('thread header renders parent message preview', async () => {
    await openThreadFromReplyCount();
    const preview = threadHeader(page).locator('.cometchat-thread-header__bubble-wrapper');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(parent);
    await expect(threadHeader(page).locator('.cometchat-thread-header__sender-name')).toHaveText(
      await getUserName(SECONDARY_USER)
    );
  });

  test('thread header shows reply count', async () => {
    await openThreadFromReplyCount();
    await expect(threadHeader(page).locator('.cometchat-thread-header__reply-count-text')).toHaveText(/^\s*1 Reply\s*$/);
  });

  
  // ==================== Thread Message List ====================

  test('thread message list loads replies', async () => {
    await openThreadFromReplyCount();
    const replies = threadList(page).locator('.cometchat-message-list__message');
    await expect(replies.filter({ hasText: reply })).toBeVisible({ timeout: 30_000 });
    // The parent is shown in the header, not repeated as a reply.
    await expect(replies.filter({ hasText: parent })).toHaveCount(0);
  });

  // ==================== Thread Composer ====================

  test('thread has its own message composer', async () => {
    await openThreadFromReplyCount();
    const threadComposer = threadPanel(page).locator('cometchat-message-composer');
    await expect(threadComposer).toBeVisible();
    // Separate from the main chat's composer, which stays on screen.
    await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
    await expect(page.locator('cometchat-message-composer')).toHaveCount(2);
  });

  // ==================== Close Thread ====================

  
  // ==================== Accessibility ====================

  test('thread header has proper ARIA attributes', async () => {
    await openThreadFromReplyCount();
    const banner = threadHeader(page).locator('.cometchat-thread-header');
    await expect(banner).toHaveAttribute('role', 'banner');
    await expect(banner).toHaveAttribute('aria-label', new RegExp(`${parent}.*\\b1 repl`));
    await expect(threadHeader(page).locator('.cometchat-thread-header__close-button')).toHaveAttribute(
      'aria-label',
      'Close thread'
    );
  });
});
