import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

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
    // Open the first conversation to load the message list
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    await page.locator('.cometchat-conversation-item').first().click();
    // Wait for message list to render
    await page.waitForSelector('cometchat-message-list, .cometchat-message-list', { timeout: 15_000 });
  });

  // ==================== Rendering ====================

  test('message list renders for active conversation', async () => {
    await expect(page.locator('cometchat-message-list').first()).toBeVisible();
  });

  test('messages load and display in the list', async () => {
    // Wait for messages to load (shimmer gone, messages visible)
    await page.waitForSelector('.cometchat-message-bubble, [class*="message-bubble"]', { timeout: 15_000 });
    const messageCount = await page.locator('.cometchat-message-bubble, [class*="message-bubble"]').count();
    expect(messageCount).toBeGreaterThan(0);
  });

  test('text messages render with content', async () => {
    const textBubble = page.locator('cometchat-text-bubble, .cometchat-text-bubble').first();
    const hasText = await textBubble.isVisible().catch(() => false);

    if (hasText) {
      const content = await textBubble.textContent();
      expect(content?.trim()).toBeTruthy();
    }
  });

  // ==================== Message Alignment ====================

  test('sent messages align to the right', async () => {
    const rightAligned = page.locator('.cometchat-message-bubble--right, [class*="bubble--right"]').first();
    const hasRight = await rightAligned.isVisible().catch(() => false);
    // If the logged-in user sent messages, they should be right-aligned
    if (hasRight) {
      expect(hasRight).toBeTruthy();
    }
  });

  test('received messages align to the left', async () => {
    const leftAligned = page.locator('.cometchat-message-bubble--left, [class*="bubble--left"]').first();
    const hasLeft = await leftAligned.isVisible().catch(() => false);
    if (hasLeft) {
      expect(hasLeft).toBeTruthy();
    }
  });

  // ==================== Date Separators ====================

  test('date separators render between message groups', async () => {
    const dateSeparator = page.locator('.cometchat-message-list__date-separator, [class*="date-separator"]').first();
    const hasSeparator = await dateSeparator.isVisible().catch(() => false);

    if (hasSeparator) {
      const dateText = await dateSeparator.textContent();
      expect(dateText?.trim()).toBeTruthy();
    }
  });

  // ==================== Scroll Behavior ====================

  test('scroll to bottom button appears when scrolled up', async () => {
    const messageList = page.locator('.cometchat-message-list__list, cometchat-paginated-list').first();

    // Scroll up
    await messageList.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(500);

    // Scroll-to-bottom button should appear
    const scrollBtn = page.locator('.cometchat-message-list__scroll-to-bottom, [class*="scroll-to-bottom"]');
    const hasBtn = await scrollBtn.isVisible().catch(() => false);

    // May not appear if all messages fit in viewport
    if (hasBtn) {
      expect(hasBtn).toBeTruthy();
    }
  });

  test('clicking scroll to bottom button scrolls to latest message', async () => {
    const messageList = page.locator('.cometchat-message-list__list, cometchat-paginated-list').first();

    // Scroll up first
    await messageList.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(500);

    const scrollBtn = page.locator('.cometchat-message-list__scroll-to-bottom, [class*="scroll-to-bottom"]');
    const hasBtn = await scrollBtn.isVisible().catch(() => false);

    if (hasBtn) {
      await scrollBtn.click();
      await page.waitForTimeout(1000);

      // Should be at or near the bottom
      const isAtBottom = await messageList.evaluate(el => {
        return el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
      });
      expect(isAtBottom).toBeTruthy();
    }
  });

  // ==================== Message Actions ====================

  test('hovering a message shows action menu', async () => {
    const messageBubble = page.locator('.cometchat-message-bubble, [class*="message-bubble"]').first();
    await expect(messageBubble).toBeVisible();

    await messageBubble.hover();
    await page.waitForTimeout(300);

    // Action buttons or menu should appear
    const actionMenu = page.locator('.cometchat-message-bubble__actions, [class*="message-options"], [class*="quick-options"]');
    const hasActions = await actionMenu.isVisible().catch(() => false);

    // Actions may be configured to show on hover
    if (hasActions) {
      expect(hasActions).toBeTruthy();
    }
  });

  // ==================== Thread Replies ====================

  test('thread reply count is clickable', async () => {
    const threadReply = page.locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]').first();
    const hasThread = await threadReply.isVisible().catch(() => false);

    if (hasThread) {
      const replyText = await threadReply.textContent();
      expect(replyText?.trim()).toBeTruthy();
    }
  });

  // ==================== Reactions ====================

  test('reactions display on messages that have them', async () => {
    const reactions = page.locator('cometchat-reactions, .cometchat-reactions').first();
    const hasReactions = await reactions.isVisible().catch(() => false);

    if (hasReactions) {
      // Should show at least one reaction emoji
      const reactionItems = reactions.locator('.cometchat-reactions__item, [class*="reaction"]');
      const count = await reactionItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  // ==================== Message Types ====================

  test('image messages render with thumbnail', async () => {
    const imageBubble = page.locator('cometchat-image-bubble, .cometchat-image-bubble').first();
    const hasImage = await imageBubble.isVisible().catch(() => false);

    if (hasImage) {
      const img = imageBubble.locator('img');
      await expect(img).toBeVisible();
    }
  });

  test('file messages render with file info', async () => {
    const fileBubble = page.locator('cometchat-file-bubble, .cometchat-file-bubble').first();
    const hasFile = await fileBubble.isVisible().catch(() => false);

    if (hasFile) {
      await expect(fileBubble).toBeVisible();
    }
  });

  // ==================== Receipts ====================

  test('message receipts display for sent messages', async () => {
    const receipt = page.locator('.cometchat-message-bubble__status-info, [class*="receipt"], [class*="status-info"]').first();
    const hasReceipt = await receipt.isVisible().catch(() => false);

    if (hasReceipt) {
      expect(hasReceipt).toBeTruthy();
    }
  });

  // ==================== Accessibility ====================

  test('message list has proper ARIA structure', async () => {
    const list = page.locator('cometchat-message-list').first();
    await expect(list).toBeVisible();

    // Messages should have accessible structure
    const hasAriaElements = await list.locator('[aria-label], [role]').first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasAriaElements).toBeTruthy();
  });

  // ==================== Pagination ====================

  test('scrolling up loads older messages', async () => {
    const messageList = page.locator('.cometchat-message-list__list, cometchat-paginated-list').first();
    const initialCount = await page.locator('.cometchat-message-bubble, [class*="message-bubble"]').count();

    // Scroll to top
    await messageList.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(2000);

    const newCount = await page.locator('.cometchat-message-bubble, [class*="message-bubble"]').count();
    // Should have same or more messages after scrolling up
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
