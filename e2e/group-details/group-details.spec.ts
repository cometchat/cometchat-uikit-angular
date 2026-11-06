import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  getUserName,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — CometChatGroupDetails (Angular)
 *
 * Tests the group details panel, opened from the header of a group this run creates (owned
 * by the primary user, with the secondary and third users as members). Every assertion
 * waits on UI state.
 */

test.describe('CometChatGroupDetails', () => {
  let page: Page;
  let groupName: string;

  test.beforeAll(async () => {
    const runId = uniqueTag();
    groupName = `E2E Details ${runId}`;
    await createE2EGroup(`e2e-details-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER, THIRD_USER]);
  });

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await openConversation(page, groupName);
  });

  const header = (): Locator => page.locator('cometchat-message-header').first();
  const details = (): Locator => page.locator('cometchat-group-details');

  /** Open group details by clicking the header's group info. */
  async function openDetails() {
    await header().locator('.cometchat-message-header__info').first().click();
    await expect(details()).toBeVisible();
  }

  // ==================== Opening Group Details ====================

  test('group details panel opens when clicking header info', async () => {
    await expect(details()).toHaveCount(0);
    await openDetails();
    await expect(details().locator('.cometchat-group-details__header-text')).toHaveText('Group Info');
  });

  // ==================== Group Info Display ====================

  test('group name and avatar display correctly', async () => {
    await openDetails();
    await expect(details().locator('.cometchat-group-details__content-title')).toHaveText(groupName);
    await expect(details().locator('.cometchat-group-details__content-description')).toHaveText(/^\s*3\s+Members\s*$/);
    const avatar = details().locator('.cometchat-group-details__content-avatar cometchat-avatar');
    await expect(avatar).toBeVisible();
    await expect(avatar.getByRole('img')).toHaveAttribute('aria-label', `Avatar for ${groupName}`);
  });

  // ==================== Members Section ====================

  test('members section shows in group details', async () => {
    await openDetails();
    const members = details().locator('cometchat-group-members cometchat-group-member-item');
    await expect(members).toHaveCount(3, { timeout: 30_000 });
    const [secondaryName, thirdName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(THIRD_USER)]);
    await expect(members.filter({ hasText: secondaryName })).toBeVisible();
    await expect(members.filter({ hasText: thirdName })).toBeVisible();
  });

  // ==================== Leave Group ====================

  test('leave group button is present', async () => {
    await openDetails();
    const leave = details().getByRole('button').filter({ hasText: 'Leave Group' });
    await expect(leave).toBeVisible();
    await expect(leave).toHaveAttribute('tabindex', '0');
  });

  // ==================== Close/Back Button ====================

  test('close button closes the details panel', async () => {
    await openDetails();
    await details().getByRole('button', { name: 'Close', exact: true }).click();
    await expect(details()).toBeHidden();
    await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
  });

  // ==================== Accessibility ====================

  test('group details panel has proper ARIA attributes', async () => {
    await openDetails();
    const close = details().getByRole('button', { name: 'Close', exact: true });
    await expect(close).toHaveAttribute('tabindex', '0');
    // The owner can view banned members: Members / Banned are tabs, Members selected.
    await expect(details().getByRole('tab', { name: 'Members', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(details().getByRole('tab', { name: 'Banned Members', exact: true })).toHaveAttribute('aria-selected', 'false');
    // The close control works from the keyboard.
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(details()).toBeHidden();
  });
});
