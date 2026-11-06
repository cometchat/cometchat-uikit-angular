import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  getUserName,
  createE2EGroup,
  E2E_USER_UIDS,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — CometChatGroupMembers (Angular)
 *
 * The members list inside group details, for a group this run creates: owned by the primary
 * user, with the secondary and third users as members. Every assertion waits on UI state.
 *
 * @see ENG-34941
 */

const header = (page: Page) => page.locator('cometchat-message-header').first();
const details = (page: Page) => page.locator('cometchat-group-details');
const members = (page: Page) => details(page).locator('cometchat-group-members');
const memberItems = (page: Page) => members(page).locator('cometchat-group-member-item');
const memberRow = (page: Page, name: string) => memberItems(page).filter({ hasText: name });

/** Open `groupName` and its details panel, and wait for the members list to load. */
async function openMembers(page: Page, groupName: string, expectedCount: number) {
  await loginToApp(page);
  await openConversation(page, groupName);
  await header(page).locator('.cometchat-message-header__info').first().click();
  await expect(details(page)).toBeVisible();
  await expect(memberItems(page)).toHaveCount(expectedCount, { timeout: 30_000 });
}

/** Search the members list, retrying while the debounced search settles. */
async function searchMembers(page: Page, query: string, ready: () => Promise<void>) {
  await expect(async () => {
    await members(page).getByRole('searchbox').fill(query);
    await ready();
  }).toPass({ timeout: 30_000 });
}

test.describe('CometChatGroupMembers', () => {
  let groupName: string;
  let secondaryName: string;
  let thirdName: string;

  test.beforeAll(async () => {
    const runId = uniqueTag();
    groupName = `E2E Members ${runId}`;
    await createE2EGroup(`e2e-members-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER, THIRD_USER]);
    [secondaryName, thirdName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(THIRD_USER)]);
  });

  // ==================== Rendering ====================

  test('members list renders for a given group', async ({ page }) => {
    await openMembers(page, groupName, 3);
    await expect(memberRow(page, secondaryName)).toBeVisible();
    await expect(memberRow(page, thirdName)).toBeVisible();
  });

  // ==================== Member Role Display ====================

  test('member role displays correctly (owner/admin/member)', async ({ page }) => {
    await openMembers(page, groupName, 3);
    // Known UI Kit defect (ENG-40632): the owner's row is named and badged "Admin". The SDK reports
    // an owner's scope as admin, and the member item uses the scope, not group.getOwner().
    // Expected to fail until fixed.
    test.fail();
    const primaryName = await getUserName(PRIMARY_USER);
    // The owner's row is named and badged as the owner; plain members show no scope label.
    await expect(memberRow(page, primaryName).getByRole('option')).toHaveAttribute('aria-label', /Owner/);
    await expect(memberRow(page, primaryName)).toContainText('Owner');
    await expect(memberRow(page, secondaryName)).not.toContainText(/Owner|Admin|Moderator/);
  });

  // ==================== Search ====================

  test('search filters members by name', async ({ page }) => {
    await openMembers(page, groupName, 3);
    await searchMembers(page, secondaryName, async () => {
      await expect(memberItems(page)).toHaveCount(1, { timeout: 3_000 });
    });
    await expect(memberRow(page, secondaryName)).toBeVisible();

    // Clearing the search brings every member back.
    await searchMembers(page, '', async () => {
      await expect(memberItems(page)).toHaveCount(3, { timeout: 3_000 });
    });
  });

  // ==================== Member Actions (Context Menu) ====================

  test('member item shows action options on hover/click', async ({ page }) => {
    await openMembers(page, groupName, 3);
    const row = memberRow(page, secondaryName);
    // The owner can act on a member: its options offer Kick, Ban and Change Scope.
    await expect(async () => {
      await row.hover();
      await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    const options = (await page.getByRole('menuitem').allTextContents()).map((t) => t.trim());
    expect(options).toEqual(expect.arrayContaining(['Kick', 'Ban', 'Change Scope']));
    await page.keyboard.press('Escape');
  });

  // ==================== Scope Change ====================

  test('scope change dropdown is present for authorized users', async ({ page }) => {
    await openMembers(page, groupName, 3);
    const row = memberRow(page, thirdName);
    await expect(async () => {
      await row.hover();
      await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await page.getByRole('menuitem', { name: 'Change Scope' }).click({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    const dialog = page.locator('.cometchat-change-scope');
    await expect(dialog).toBeVisible();
    for (const scope of ['Admin', 'Moderator', 'Participant']) {
      await expect(dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: scope })).toBeVisible();
    }
    // Leave the scope as it was.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  // ==================== Pagination ====================

  test('scrolling loads more members (pagination)', async ({ page }) => {
    // More members than one page (30): the owner, the run's two users and the 30 shared fillers.
    const runId = uniqueTag();
    const bigGroup = `E2E Many Members ${runId}`;
    await createE2EGroup(`e2e-many-members-${runId}`, bigGroup, PRIMARY_USER, [
      PRIMARY_USER,
      SECONDARY_USER,
      THIRD_USER,
      ...E2E_USER_UIDS,
    ]);
    await openMembers(page, bigGroup, 30);

    // Scrolling the list to its end loads the rest.
    await expect(async () => {
      await memberItems(page).last().scrollIntoViewIfNeeded();
      await expect(memberItems(page)).toHaveCount(3 + E2E_USER_UIDS.length, { timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
  });

  // ==================== Empty State ====================

  test('empty state renders when no members match search', async ({ page }) => {
    await openMembers(page, groupName, 3);
    const empty = members(page).locator('.cometchat-group-members__empty-state-view');
    await searchMembers(page, `nomember${uniqueTag()}`, async () => {
      await expect(empty).toBeVisible({ timeout: 3_000 });
    });
    await expect(memberItems(page)).toHaveCount(0);
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works', async ({ page }) => {
    await openMembers(page, groupName, 3);
    const focusedMember = () =>
      page.evaluate(
        () =>
          document.activeElement?.closest('.cometchat-paginated-list__item')?.querySelector('.cometchat-group-member-item__title-text')?.textContent?.trim() ?? ''
      );

    // Tab from the search box into the list, then ArrowDown to the next member.
    await members(page).getByRole('searchbox').focus();
    await page.keyboard.press('Tab');
    const first = await focusedMember();
    expect(first, 'a member row has keyboard focus').toBeTruthy();
    await page.keyboard.press('ArrowDown');
    await expect.poll(focusedMember).not.toBe(first);
  });

  // ==================== Accessibility ====================

  test('group members list has proper ARIA attributes', async ({ page }) => {
    await openMembers(page, groupName, 3);
    await expect(members(page).getByRole('listbox', { name: 'Group Members' })).toBeVisible();
    await expect(members(page).getByRole('searchbox')).toBeVisible();
    await expect(memberItems(page).getByRole('option').first()).toHaveAttribute('aria-label', /.+/);
  });

  // ==================== Back Button ====================

  test('back button navigates away from members list', async ({ page }) => {
    await openMembers(page, groupName, 3);
    await details(page).getByRole('button', { name: 'Close', exact: true }).click();
    await expect(details(page)).toBeHidden();
    await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
  });
});
