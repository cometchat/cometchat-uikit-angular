import { test, expect, Page } from '../fixtures/coverage';
import { loginToApp, openConversation, getUserName, PRIMARY_USER, SECONDARY_USER } from '../helpers';

/**
 * E2E Tests — CometChatMessageHeader (Angular)
 *
 * Tests the message header component. Requires opening a conversation first.
 *
 * @see ENG-34937
 */

test.describe('CometChatMessageHeader', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    // Open the first conversation. A click straight after the list renders can be lost while
    // the list is still updating, so openConversation retries until the header shows it.
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    const firstName = (await page.locator('.cometchat-conversation-item__title-text').first().textContent())?.trim() ?? '';
    await openConversation(page, firstName);
    // Wait for message header to render
    await page.waitForSelector('cometchat-message-header, .cometchat-message-header', { timeout: 15_000 });
  });

  // ==================== Rendering ====================

  
  test('header displays user/group name @smoke', async () => {
    const title = page.locator('.cometchat-message-header__title, [class*="message-header"] [class*="title"]').first();
    await expect(title).toBeVisible();
    const name = await title.textContent();
    expect(name?.trim()).toBeTruthy();
  });

  
  // ==================== User Status ====================

  
  // ==================== Subtitle ====================

  
  // ==================== Call Buttons ====================

  
  
  // ==================== Back Button ====================

  
  // ==================== Search Icon ====================

  
  // ==================== Typing Indicator ====================

  test('typing indicator area exists in subtitle', async ({ browser }) => {
    // The typing indicator replaces the subtitle while the other person types. Have the
    // secondary user type in their own session and check the primary user's header subtitle.
    const [primaryName, secondaryName] = await Promise.all([getUserName(PRIMARY_USER), getUserName(SECONDARY_USER)]);
    await openConversation(page, secondaryName);
    const other = await browser.newContext();
    try {
      const otherPage = await other.newPage();
      await loginToApp(otherPage, { userUid: SECONDARY_USER });
      await openConversation(otherPage, primaryName);
      await otherPage.locator('cometchat-message-composer [contenteditable="true"]').first().click();
      await otherPage.keyboard.type('typing a reply', { delay: 40 });

      const typing = page.locator('cometchat-message-header .cometchat-message-header__subtitle--typing');
      await expect(typing).toBeVisible({ timeout: 15_000 });
      await expect(typing).toContainText('Typing');
    } finally {
      await other.close();
    }
  });

  // ==================== Accessibility ====================

  test('header has proper ARIA attributes', async () => {
    const header = page.locator('cometchat-message-header').first();
    await expect(header).toBeVisible();

    // Call buttons should have aria-labels
    await expect(header.locator('[aria-label]').first()).toBeVisible({ timeout: 3_000 });
  });

  // ==================== Group Header ====================

  
});
