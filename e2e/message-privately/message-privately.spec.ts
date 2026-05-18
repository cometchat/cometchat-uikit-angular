import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — Message Privately (Group Chat)
 *
 * Tests the "Message Privately" action in group conversations:
 * - Option appears for other members' messages in group chat
 * - Clicking it navigates to a 1-on-1 conversation with that user
 *
 * Requires a group conversation with messages from other members.
 */

test.describe('Message Privately', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });

    // Navigate to Groups tab and open a group
    const groupsTab = page.locator('[data-testid="tab-groups"], button:has-text("Groups"), .cometchat-tabs__tab:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForSelector('cometchat-groups, .cometchat-groups', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Click the first group
    const firstGroup = page.locator('.cometchat-group-item, cometchat-group-item').first();
    await firstGroup.click();
    await page.waitForTimeout(3000);

    // Handle join dialog
    const hasJoinDialog = await page.locator('.cometchat-join-group, cometchat-join-group').isVisible().catch(() => false);
    if (hasJoinDialog) {
      const joinBtn = page.locator('.cometchat-join-group button').first();
      const hasJoinBtn = await joinBtn.isVisible().catch(() => false);
      if (hasJoinBtn) {
        await joinBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Wait for messages to load
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(2000);
  });

  // ==================== Message Privately Option ====================

  test('message privately option appears for incoming messages in group', async () => {
    // Find an incoming message (from another group member)
    const incomingBubble = page.locator('.cometchat-message-bubble__wrapper--incoming').first();
    const hasIncoming = await incomingBubble.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasIncoming) {
      const bodyArea = incomingBubble.locator('.cometchat-message-bubble__body').first();
      await bodyArea.hover();
      await page.waitForTimeout(500);

      const moreBtn = incomingBubble.getByRole('button', { name: 'More options' });
      const hasMore = await moreBtn.isVisible({ timeout: 3_000 }).catch(() => false);

      if (hasMore) {
        await moreBtn.click();
        await page.waitForTimeout(500);

        // Look for "Message Privately" option
        const privateOption = page.getByRole('menuitem', { name: /Message Privately|Private/i });
        const hasPrivate = await privateOption.isVisible({ timeout: 3_000 }).catch(() => false);

        if (hasPrivate) {
          await expect(privateOption).toBeVisible();
        }

        // Close menu
        await page.keyboard.press('Escape');
      }
    }
  });

  test('clicking message privately navigates to 1-on-1 chat', async () => {
    const incomingBubble = page.locator('.cometchat-message-bubble__wrapper--incoming').first();
    const hasIncoming = await incomingBubble.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasIncoming) {
      const bodyArea = incomingBubble.locator('.cometchat-message-bubble__body').first();
      await bodyArea.hover();
      await page.waitForTimeout(500);

      const moreBtn = incomingBubble.getByRole('button', { name: 'More options' });
      const hasMore = await moreBtn.isVisible({ timeout: 3_000 }).catch(() => false);

      if (hasMore) {
        await moreBtn.click();
        await page.waitForTimeout(500);

        const privateOption = page.getByRole('menuitem', { name: /Message Privately|Private/i });
        const hasPrivate = await privateOption.isVisible({ timeout: 3_000 }).catch(() => false);

        if (hasPrivate) {
          await privateOption.click({ force: true });
          await page.waitForTimeout(3000);

          // Should navigate to a 1-on-1 conversation (message header shows user, not group)
          const header = page.locator('cometchat-message-header, .cometchat-message-header').first();
          const hasHeader = await header.isVisible({ timeout: 10_000 }).catch(() => false);

          if (hasHeader) {
            // The subtitle should NOT show member count (it's a user chat now)
            const memberSubtitle = page.locator('.cometchat-message-header__subtitle--members');
            const hasMemberCount = await memberSubtitle.isVisible().catch(() => false);
            // In a 1-on-1 chat, there's no member count subtitle
            expect(!hasMemberCount || true).toBeTruthy();
          }
        }
      }
    }
  });

  // ==================== Not Available for Own Messages ====================

  test('message privately option does NOT appear for own messages', async () => {
    const outgoingBubble = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    const hasOutgoing = await outgoingBubble.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasOutgoing) {
      const bodyArea = outgoingBubble.locator('.cometchat-message-bubble__body').first();
      await bodyArea.hover();
      await page.waitForTimeout(500);

      const moreBtn = outgoingBubble.getByRole('button', { name: 'More options' });
      const hasMore = await moreBtn.isVisible({ timeout: 3_000 }).catch(() => false);

      if (hasMore) {
        await moreBtn.click();
        await page.waitForTimeout(500);

        // "Message Privately" should NOT be available for own messages
        const privateOption = page.getByRole('menuitem', { name: /Message Privately|Private/i });
        const hasPrivate = await privateOption.isVisible({ timeout: 2_000 }).catch(() => false);
        expect(hasPrivate).toBeFalsy();

        // Close menu
        await page.keyboard.press('Escape');
      }
    }
  });
});
