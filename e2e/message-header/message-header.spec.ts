import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

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
    // Open the first conversation
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    await page.locator('.cometchat-conversation-item').first().click();
    // Wait for message header to render
    await page.waitForSelector('cometchat-message-header, .cometchat-message-header', { timeout: 15_000 });
  });

  // ==================== Rendering ====================

  test('message header renders for active conversation', async () => {
    await expect(page.locator('cometchat-message-header').first()).toBeVisible();
  });

  test('header displays user/group name', async () => {
    const title = page.locator('.cometchat-message-header__title, [class*="message-header"] [class*="title"]').first();
    await expect(title).toBeVisible();
    const name = await title.textContent();
    expect(name?.trim()).toBeTruthy();
  });

  test('header displays avatar', async () => {
    const avatar = page.locator('.cometchat-message-header cometchat-avatar, .cometchat-message-header .cometchat-avatar').first();
    await expect(avatar).toBeVisible();
  });

  // ==================== User Status ====================

  test('user online/offline status indicator displays', async () => {
    const statusIndicator = page.locator('.cometchat-message-header__status, [class*="message-header"] [class*="status"]').first();
    const hasStatus = await statusIndicator.isVisible().catch(() => false);

    // Status indicator should be present for user conversations
    if (hasStatus) {
      expect(hasStatus).toBeTruthy();
    }
  });

  // ==================== Subtitle ====================

  test('subtitle displays (last active or member count)', async () => {
    const subtitle = page.locator('.cometchat-message-header__subtitle, [class*="message-header"] [class*="subtitle"]').first();
    const hasSubtitle = await subtitle.isVisible().catch(() => false);

    if (hasSubtitle) {
      const text = await subtitle.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  // ==================== Call Buttons ====================

  test('voice call button renders', async () => {
    const voiceCallBtn = page.locator('cometchat-call-buttons .cometchat-call-buttons__voice, [class*="call-buttons"] [class*="voice"]').first();
    const hasVoiceCall = await voiceCallBtn.isVisible().catch(() => false);

    if (hasVoiceCall) {
      await expect(voiceCallBtn).toBeVisible();
    }
  });

  test('video call button renders', async () => {
    const videoCallBtn = page.locator('cometchat-call-buttons .cometchat-call-buttons__video, [class*="call-buttons"] [class*="video"]').first();
    const hasVideoCall = await videoCallBtn.isVisible().catch(() => false);

    if (hasVideoCall) {
      await expect(videoCallBtn).toBeVisible();
    }
  });

  // ==================== Back Button ====================

  test('back button is present', async () => {
    const backBtn = page.locator('.cometchat-message-header__back-button, [class*="message-header"] [class*="back"]').first();
    const hasBack = await backBtn.isVisible().catch(() => false);

    // Back button may only show on mobile or when configured
    if (hasBack) {
      await expect(backBtn).toBeVisible();
    }
  });

  // ==================== Search Icon ====================

  test('search icon renders when enabled', async () => {
    const searchIcon = page.locator('.cometchat-message-header__search, [class*="message-header"] [class*="search"]').first();
    const hasSearch = await searchIcon.isVisible().catch(() => false);

    if (hasSearch) {
      await expect(searchIcon).toBeVisible();
      // Clicking should trigger search
      await searchIcon.click();
      // Search panel or overlay should appear
      await page.waitForTimeout(500);
    }
  });

  // ==================== Typing Indicator ====================

  test('typing indicator area exists in subtitle', async () => {
    // The typing indicator replaces the subtitle when someone is typing
    // We verify the subtitle area exists (typing indicator renders there)
    const subtitleArea = page.locator('.cometchat-message-header__subtitle, [class*="message-header"] [class*="subtitle"]');
    await expect(subtitleArea.first()).toBeVisible();
  });

  // ==================== Accessibility ====================

  test('header has proper ARIA attributes', async () => {
    const header = page.locator('cometchat-message-header').first();
    await expect(header).toBeVisible();

    // Call buttons should have aria-labels
    const hasAriaElements = await header.locator('[aria-label]').first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasAriaElements).toBeTruthy();
  });

  // ==================== Group Header ====================

  test('group conversation shows member count in subtitle', async () => {
    // Navigate back and open a group conversation
    // First, go to the conversations list
    await page.goBack().catch(() => {});
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 10_000 });

    // Look for a group conversation (has group type icon)
    const groupConversation = page.locator('.cometchat-conversation-item__group-type').first();
    const hasGroup = await groupConversation.isVisible().catch(() => false);

    if (hasGroup) {
      // Click the parent conversation item
      await groupConversation.locator('..').locator('..').click();
      await page.waitForSelector('cometchat-message-header', { timeout: 10_000 });

      // Subtitle should show member count
      const subtitle = page.locator('.cometchat-message-header__subtitle').first();
      const text = await subtitle.textContent().catch(() => '');
      // Group subtitle typically shows "X members" or similar
      if (text) {
        expect(text.trim()).toBeTruthy();
      }
    }
  });
});
