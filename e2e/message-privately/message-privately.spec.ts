import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  createE2EGroup,
  sendMessageAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — Message Privately (Group Chat)
 *
 * Tests the "Message Privately" action in group conversations:
 * - Option appears for other members' messages in group chat
 * - Clicking it navigates to a 1-on-1 conversation with that user
 * - It is not offered on your own messages
 *
 * Each test arranges its own group over REST, with one message from the secondary user and
 * one from the primary user, so the incoming and outgoing bubbles always exist.
 */

const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const row = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

/** A group with a message from each side; logs in as the primary user and opens it. */
async function openGroupWithMessages(page: Page) {
  const tag = uniqueTag();
  const group = { guid: `e2e-private-${tag}`, name: `E2E Privately ${tag}` };
  await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER]);
  const incoming = `Incoming note ${tag}`;
  const outgoing = `Outgoing note ${tag}`;
  const send = (sender: string, text: string) =>
    sendMessageAs(sender, group.guid, { category: 'message', type: 'text', data: { text } }, 'group');
  await send(SECONDARY_USER, incoming);
  await send(PRIMARY_USER, outgoing);
  await loginToApp(page);
  await openConversation(page, group.name);
  await scrollToLatestMessage(page);
  await expect(row(page, incoming)).toBeVisible({ timeout: 30_000 });
  await expect(row(page, outgoing)).toBeVisible({ timeout: 30_000 });
  return { group, incoming, outgoing };
}

/** Hover a message row and open its "More options" menu. */
async function openMoreOptions(page: Page, message: Locator) {
  await message.locator('.cometchat-message-bubble__body').first().hover();
  await message.getByRole('button', { name: 'More options' }).click();
}

test.describe('Message Privately', () => {
  test('message privately option appears for incoming messages in group', async ({ page }) => {
    const { incoming } = await openGroupWithMessages(page);
    const message = row(page, incoming);
    await expect(message.locator('.cometchat-message-bubble-incoming')).toBeVisible();

    await openMoreOptions(page, message);
    await expect(page.getByRole('menuitem', { name: 'Message Privately' })).toBeVisible();
  });

  test('clicking message privately navigates to 1-on-1 chat', async ({ page }) => {
    const secondaryName = await getUserName(SECONDARY_USER);
    const { group, incoming } = await openGroupWithMessages(page);

    await openMoreOptions(page, row(page, incoming));
    await page.getByRole('menuitem', { name: 'Message Privately' }).click();

    // The chat now open is the 1:1 with the sender: their name, no group member count.
    const header = page.locator('cometchat-message-header').first();
    await expect(header.locator('.cometchat-message-header__title')).toHaveText(secondaryName, { timeout: 15_000 });
    await expect(header).not.toContainText(group.name);
    await expect(header.locator('.cometchat-message-header__subtitle--members')).toHaveCount(0);
    await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
  });

  // ==================== Not Available for Own Messages ====================

  test('message privately option does NOT appear for own messages', async ({ page }) => {
    const { outgoing } = await openGroupWithMessages(page);
    const message = row(page, outgoing);
    await expect(message.locator('.cometchat-message-bubble-outgoing')).toBeVisible();

    await openMoreOptions(page, message);
    // The menu is open (it lists the options own messages do get), and Message Privately is not among them.
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Message Privately' })).toHaveCount(0);
  });
});
