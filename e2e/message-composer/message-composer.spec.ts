import { test, expect, Page } from '../fixtures/coverage';
import { loginToApp, openConversation } from '../helpers';

/**
 * E2E Tests — CometChatMessageComposer (Angular)
 *
 * Tests the message composer component. Requires opening a conversation first.
 *
 * @see ENG-34938
 */

test.describe('CometChatMessageComposer', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    // Open the first conversation. A click straight after the list renders can be lost while
    // the list is still updating, so openConversation retries until the header shows it.
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    const firstName = (await page.locator('.cometchat-conversation-item__title-text').first().textContent())?.trim() ?? '';
    await openConversation(page, firstName);
    // Wait for composer to render
    await page.waitForSelector('cometchat-message-composer, .cometchat-message-composer', { timeout: 15_000 });
  });

  // ==================== Rendering ====================

  
  test('send button is present', async () => {
    const composer = page.locator('cometchat-message-composer').first();
    const sendBtn = composer.locator('[class*="send-button"], [class*="send"], button[aria-label*="Send"], button[aria-label*="send"]').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Text Input ====================

  test('typing text in composer works', async () => {
    const composer = page.locator('cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Hello E2E test');
    await expect(input).toHaveText('Hello E2E test');
  });

  
  
  // ==================== Attachment Menu ====================

  test('attachment button opens menu', async () => {
    const composer = page.locator('cometchat-messages cometchat-message-composer').first();
    await composer.getByRole('button', { name: 'Add attachment' }).click();
    const items = page.locator('.cometchat-action-sheet__item');
    await expect(items.first()).toBeVisible();
    for (const item of ['Attach Image', 'Attach File']) {
      await expect(items.filter({ hasText: item })).toBeVisible();
    }
  });

  // ==================== Emoji Keyboard ====================

  test('emoji button opens emoji keyboard', async () => {
    const composer = page.locator('cometchat-messages cometchat-message-composer').first();
    await composer.getByRole('button', { name: 'Emoji' }).click();
    await expect(page.locator('cometchat-emoji-keyboard')).toBeVisible();
    await expect(page.locator('.cometchat-emoji-keyboard__list-item').first()).toBeAttached();
  });

  // ==================== Voice Recording ====================

  
  // ==================== Live Reaction ====================

  
  // ==================== Placeholder ====================

  
  // ==================== Formatting Toolbar ====================

  
  // ==================== Accessibility ====================

  
  // ==================== Disabled State ====================

  test('composer input is interactive by default', async () => {
    const composer = page.locator('cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible();
    const isEditable = await input.getAttribute('contenteditable');
    expect(isEditable).toBe('true');
  });
});
