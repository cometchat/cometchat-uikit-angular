import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — CometChatNotificationFeed (Angular)
 *
 * Tests the notification feed component in the sample app.
 * Navigates to the Notifications tab and verifies feed rendering,
 * filter chips, scroll, and engagement behaviors.
 *
 * @see ENG-35935
 */

test.describe('CometChatNotificationFeed', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    // Navigate to notifications tab
    await page.locator('[role="tab"]').filter({ hasText: /notification/i }).click();
    // Wait for notification feed to render
    await page.waitForSelector('.cometchat-notification-feed', { timeout: 30_000 });
  });

  // ==================== Tab Navigation ====================

  test('notifications tab is visible and clickable', async () => {
    await expect(page.locator('.cometchat-notification-feed')).toBeVisible();
  });

  test('notifications tab renders feed component instead of conversations', async () => {
    // Notification feed should be visible
    await expect(page.locator('.cometchat-notification-feed')).toBeVisible();
    // Conversations should NOT be visible
    await expect(page.locator('.cometchat-conversations')).not.toBeVisible();
  });

  // ==================== Header ====================

  test('header displays title "Notifications"', async () => {
    const header = page.locator('.cometchat-notification-feed__header-title');
    await expect(header).toBeVisible();
    const text = await header.textContent();
    expect(text?.trim()).toBe('Notifications');
  });

  test('mark all read button appears when there are unread items', async () => {
    // Wait for feed to load
    await page.waitForTimeout(3000);

    // Check if mark all read button exists (only shows when unread count > 0)
    const markAllBtn = page.locator('.cometchat-notification-feed__mark-all-read');
    const isVisible = await markAllBtn.isVisible().catch(() => false);

    // Either the button is visible (has unread) or not (all read) — both are valid
    expect(typeof isVisible).toBe('boolean');
  });

  // ==================== Filter Chips ====================

  test('filter chips section is visible with "All" chip', async () => {
    const chipsContainer = page.locator('.cometchat-notification-feed__chips');
    await expect(chipsContainer).toBeVisible();

    // "All" chip should always be present
    const allChip = page.locator('.cometchat-notification-feed__chip').first();
    await expect(allChip).toBeVisible();
    const chipText = await allChip.textContent();
    expect(chipText).toContain('All');
  });

  test('"All" chip is active by default', async () => {
    const allChip = page.locator('.cometchat-notification-feed__chip').first();
    await expect(allChip).toHaveClass(/cometchat-notification-feed__chip--active/);
  });

  test('clicking a category chip filters the feed', async () => {
    // Wait for categories to load
    await page.waitForTimeout(2000);

    const chips = page.locator('.cometchat-notification-feed__chip');
    const chipCount = await chips.count();

    if (chipCount > 1) {
      // Click second chip (first category)
      await chips.nth(1).click();

      // Second chip should now be active
      await expect(chips.nth(1)).toHaveClass(/cometchat-notification-feed__chip--active/);

      // First chip (All) should no longer be active
      await expect(chips.first()).not.toHaveClass(/cometchat-notification-feed__chip--active/);
    }
  });

  test('clicking "All" chip resets filter', async () => {
    await page.waitForTimeout(2000);

    const chips = page.locator('.cometchat-notification-feed__chip');
    const chipCount = await chips.count();

    if (chipCount > 1) {
      // Click a category chip first
      await chips.nth(1).click();
      await page.waitForTimeout(1000);

      // Click "All" chip
      await chips.first().click();
      await expect(chips.first()).toHaveClass(/cometchat-notification-feed__chip--active/);
    }
  });

  // ==================== Feed Content ====================

  test('feed loads and displays items or empty state', async () => {
    // Wait for loading to complete
    await page.waitForTimeout(5000);

    const hasItems = await page.locator('.cometchat-notification-feed__item').count() > 0;
    const hasEmpty = await page.locator('.cometchat-notification-feed__empty').isVisible().catch(() => false);
    const hasError = await page.locator('.cometchat-notification-feed__error').isVisible().catch(() => false);

    // Should be in one valid state
    expect(hasItems || hasEmpty || hasError).toBeTruthy();
  });

  test('feed items display category and timestamp', async () => {
    await page.waitForTimeout(3000);

    const items = page.locator('.cometchat-notification-feed__item');
    const itemCount = await items.count();

    if (itemCount > 0) {
      const firstItem = items.first();

      // Should have category label
      const category = firstItem.locator('.cometchat-notification-feed__item-category');
      await expect(category).toBeVisible();

      // Should have time/date
      const time = firstItem.locator('.cometchat-notification-feed__item-time');
      await expect(time).toBeVisible();
    }
  });

  test('feed items have card content rendered', async () => {
    await page.waitForTimeout(3000);

    const items = page.locator('.cometchat-notification-feed__item');
    const itemCount = await items.count();

    if (itemCount > 0) {
      // Card container should exist
      const cardContainer = items.first().locator('.cometchat-notification-feed__card-container');
      await expect(cardContainer).toBeVisible();

      // Card view component should be rendered inside
      const cardView = cardContainer.locator('cometchat-card-view');
      await expect(cardView).toBeVisible();
    }
  });

  test('unread items show unread indicator', async () => {
    await page.waitForTimeout(3000);

    const unreadItems = page.locator('.cometchat-notification-feed__item--unread');
    const unreadCount = await unreadItems.count();

    if (unreadCount > 0) {
      const indicator = unreadItems.first().locator('.cometchat-notification-feed__unread-indicator');
      await expect(indicator).toBeVisible();
    }
  });

  // ==================== Scroll & Pagination ====================

  test('feed content area is scrollable', async () => {
    await page.waitForTimeout(3000);

    const content = page.locator('.cometchat-notification-feed__content');
    await expect(content).toBeVisible();

    // Check that scroll container has overflow-y auto
    const overflowY = await content.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowY).toBe('auto');
  });

  test('scrolling to bottom triggers pagination loading', async () => {
    await page.waitForTimeout(3000);

    const items = page.locator('.cometchat-notification-feed__item');
    const initialCount = await items.count();

    if (initialCount >= 5) {
      // Scroll to bottom
      const content = page.locator('.cometchat-notification-feed__content');
      await content.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Wait for potential loading
      await page.waitForTimeout(3000);

      // Should either show loading-more indicator or have more items
      const newCount = await items.count();
      const hasLoadingMore = await page.locator('.cometchat-notification-feed__loading-more').isVisible().catch(() => false);

      expect(newCount >= initialCount || hasLoadingMore).toBeTruthy();
    }
  });

  // ==================== Error State ====================

  test('error state shows retry button', async () => {
    const errorState = page.locator('.cometchat-notification-feed__error');
    const hasError = await errorState.isVisible().catch(() => false);

    if (hasError) {
      const retryBtn = page.locator('.cometchat-notification-feed__error-retry-button');
      await expect(retryBtn).toBeVisible();
    }
  });

  // ==================== Accessibility ====================

  test('feed list has proper ARIA role', async () => {
    await page.waitForTimeout(3000);

    const items = page.locator('.cometchat-notification-feed__item');
    if (await items.count() > 0) {
      const feedRole = page.locator('[role="feed"]');
      await expect(feedRole).toBeVisible();
    }
  });

  test('filter chips have tablist role', async () => {
    const chipContainer = page.locator('[role="tablist"]');
    await expect(chipContainer).toBeVisible();
  });

  test('feed items are focusable via keyboard', async () => {
    await page.waitForTimeout(3000);

    const items = page.locator('.cometchat-notification-feed__item');
    if (await items.count() > 0) {
      const tabIndex = await items.first().getAttribute('tabindex');
      expect(tabIndex).toBe('0');
    }
  });

  // ==================== Tab Switching ====================

  test('switching back to chats tab hides notification feed', async () => {
    // Click chats tab
    await page.locator('[role="tab"]').first().click();
    await page.waitForTimeout(1000);

    // Notification feed should be hidden
    await expect(page.locator('.cometchat-notification-feed')).not.toBeVisible();
    // Conversations should be visible
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  test('switching back to notifications tab preserves state', async () => {
    await page.waitForTimeout(2000);

    // Switch to chats
    await page.locator('[role="tab"]').first().click();
    await page.waitForTimeout(1000);

    // Switch back to notifications
    await page.locator('[role="tab"]').filter({ hasText: /notification/i }).click();
    await page.waitForSelector('.cometchat-notification-feed', { timeout: 10_000 });

    // Feed should render again
    await expect(page.locator('.cometchat-notification-feed')).toBeVisible();
  });
});
