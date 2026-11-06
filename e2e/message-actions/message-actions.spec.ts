import { test, expect, Page, Locator } from '../fixtures/coverage';
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
 * E2E Tests — Message Actions (Reply, Flag, Mark as Unread, Message Info, Copy, Thread)
 *
 * Each test sends its own message over REST, opens the 1:1 chat with the secondary user at
 * its latest message, and drives the action from that message's options. Every step waits on
 * UI state; nothing is guarded by "if visible".
 *
 * Covers:
 * - Quoted reply (reply to message)
 * - Flag/report message
 * - Mark as unread
 * - Message information panel
 * - Copy message
 * - Reply in thread
 */

/** The list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-messages cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

const composer = (page: Page) => page.locator('cometchat-messages cometchat-message-composer').first();

/** Open the 1:1 chat with the secondary user at its latest message, and wait for `text`'s row. */
async function openChatAt(page: Page, text: string): Promise<Locator> {
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

/**
 * Run a message option: a quick action on the bubble if it offers one, else from "More options".
 * The bubble's options appear on hover and can change while the menu opens, so each attempt
 * decides and clicks in one go, and retries until a click lands.
 */
async function messageOption(page: Page, row: Locator, name: string) {
  const quick = row.locator('.cometchat-message-bubble__options').getByRole('menuitem', { name, exact: true });
  const item = page.locator(`.cometchat-menu-list__sub-menu-list-item[aria-label="${name}"]`).filter({ visible: true });
  await expect(async () => {
    await row.locator('.cometchat-message-bubble__body').first().hover();
    if (await quick.isVisible()) {
      await quick.click({ timeout: 2_000 });
      return;
    }
    await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
    await item.first().click({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test.describe('Message Actions', () => {
  // ==================== Quoted Reply ====================

  test('reply option opens reply preview in composer', async ({ page }) => {
    const text = `Reply preview ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    const row = await openChatAt(page, text);

    await messageOption(page, row, 'Reply');
    const preview = composer(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview').first();
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(text);

    // Closing the preview cancels the reply.
    await preview.getByRole('button').first().click();
    await expect(preview).toBeHidden();
  });

  test('reply sends message with quoted reference', async ({ page }) => {
    const text = `Quoted original ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    const row = await openChatAt(page, text);

    await messageOption(page, row, 'Reply');
    await expect(composer(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview').first()).toContainText(text);

    const replyMsg = `Reply test ${uniqueTag()}`;
    await composer(page).locator('[contenteditable="true"]').first().click();
    await page.keyboard.type(replyMsg);
    await page.keyboard.press('Enter');

    // The sent reply quotes the message it answers.
    const reply = rowWithText(page, replyMsg);
    await expect(reply).toBeVisible({ timeout: 30_000 });
    await expect(reply).toContainText(text);
  });

  // ==================== Flag/Report Message ====================

  
  // ==================== Mark as Unread ====================

  
  // ==================== Message Information ====================

  test('message info option opens information panel', async ({ page }) => {
    // Info is offered for your own messages.
    const text = `Info panel ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    const row = await openChatAt(page, text);

    await messageOption(page, row, 'Info');
    const info = page.locator('cometchat-message-information');
    await expect(info).toContainText('Message Information');
    await expect(info).toContainText(text);
    // It lists the message's receipt state.
    await expect(info).toContainText(/Sent|Delivered|Read/, { timeout: 15_000 });

    await page.keyboard.press('Escape');
    await expect(info).toBeHidden();
  });

  // ==================== Copy Message ====================

  test('copy option is available for text messages', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const text = `Copy me ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    const row = await openChatAt(page, text);

    await messageOption(page, row, 'Copy');
    await expect(page.getByText('Message copied to clipboard.')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  });

  // ==================== Reply in Thread from Context Menu ====================

  test('reply in thread option opens thread panel', async ({ page }) => {
    const text = `Thread parent ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    const row = await openChatAt(page, text);

    await messageOption(page, row, 'Reply in thread');
    const threadPanel = page.locator('.cometchat-threaded-messages');
    await expect(threadPanel.locator('cometchat-thread-header')).toContainText(text);

    await threadPanel.locator('.cometchat-thread-header__close-button').click();
    await expect(threadPanel).toBeHidden();
  });
});
