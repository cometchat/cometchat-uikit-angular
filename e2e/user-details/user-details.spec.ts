import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, openConversation, getUserName, SECONDARY_USER } from '../helpers';

/**
 * E2E Tests — CometChatUserDetails (Angular)
 *
 * Tests the user details panel, opened from the header of the seeded 1:1 chat with the
 * secondary user. Every assertion waits on UI state.
 *
 * @see ENG-34987
 */

test.describe('CometChatUserDetails', () => {
  let page: Page;
  let secondaryName: string;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    await openConversation(page, secondaryName);
  });

  const header = (): Locator => page.locator('cometchat-message-header').first();
  const details = (): Locator => page.locator('cometchat-user-details');

  /** Open user details by clicking the header's user info. */
  async function openDetails() {
    await header().locator('.cometchat-message-header__info').first().click();
    await expect(details()).toBeVisible();
  }

  // ==================== Opening User Details ====================

  test('user details panel opens when clicking header info', async () => {
    await expect(details()).toHaveCount(0);
    await openDetails();
    await expect(details().locator('.cometchat-user-details__header-text')).toHaveText('User Info');
  });

  // ==================== User Info Display ====================

  test('user name and avatar display correctly', async () => {
    await openDetails();
    await expect(details().locator('.cometchat-user-details__content-title')).toHaveText(secondaryName);
    // No profile picture: the avatar shows the user's initials.
    const avatar = details().locator('.cometchat-user-details__content-avatar cometchat-avatar');
    await expect(avatar).toBeVisible();
    await expect(avatar.getByRole('img')).toHaveAttribute('aria-label', `Avatar for ${secondaryName}`);
    const initials = secondaryName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    await expect(avatar.locator('.cometchat-avatar__text')).toHaveText(initials);
  });

  // ==================== Online/Offline Status ====================

  test('online/offline status shows in details', async () => {
    // The header's presence dot names the user's status; details show the same in words.
    const headerStatus = header().locator('.cometchat-message-header__status-indicator');
    await expect(headerStatus).toHaveAttribute('aria-label', /^(Online|Offline)$/);
    const status = (await headerStatus.getAttribute('aria-label'))!;
    await openDetails();
    await expect(details().locator('.cometchat-user-details__content-description')).toHaveText(status);
  });

  // ==================== Block User ====================

  test('block user button is present', async () => {
    await openDetails();
    const block = details().getByRole('button').filter({ hasText: 'Block User' });
    await expect(block).toBeVisible();
    await expect(block).toHaveAttribute('tabindex', '0');
  });

  // ==================== Close/Back Button ====================

  test('close button closes the details panel', async () => {
    await openDetails();
    await details().getByRole('button', { name: 'Close', exact: true }).click();
    await expect(details()).toBeHidden();
    // The chat stays open.
    await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
  });

  // ==================== Accessibility ====================

  test('user details panel has proper ARIA attributes', async () => {
    await openDetails();
    const close = details().getByRole('button', { name: 'Close', exact: true });
    await expect(close).toHaveAttribute('tabindex', '0');
    // The close control works from the keyboard.
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(details()).toBeHidden();
  });
});
