import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  addReactionAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — CometChatReactions (Angular)
 *
 * Reactions on a message: the pills and their counts, adding your own, who reacted (hover),
 * the React option and its emoji picker, the "+N more" list, and ARIA. Each test sends its own
 * message from the secondary user to the primary user and adds reactions to it over REST
 * before opening the chat, so the reactions it checks are known. Only the two people in a 1:1
 * chat can react to its messages.
 *
 * @see ENG-34984
 */

const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-messages cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();
const pill = (reactions: Locator, emoji: string) =>
  reactions.locator('.cometchat-reactions__reaction').filter({ hasText: emoji });

/**
 * Send a message from the secondary user, react to it as `reactions` (uid → emojis), then log in
 * as the primary user and open the chat at it. Returns the message row and its reactions.
 */
async function messageWithReactions(page: Page, reactions: Record<string, string[]>) {
  const text = `React to this ${uniqueTag()}`;
  const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
  for (const [uid, emojis] of Object.entries(reactions)) {
    for (const emoji of emojis) await addReactionAs(uid, id, emoji);
  }
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  return { row, reactions: row.locator('cometchat-reactions') };
}

test.describe('CometChatReactions', () => {
  // ==================== Reactions Display ====================

  test('reactions display on messages that have them', async ({ page }) => {
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['👍'] });
    await expect(reactions).toBeVisible({ timeout: 15_000 });
    await expect(pill(reactions, '👍')).toBeVisible();
  });

  // ==================== Reaction Count ====================

  test('reaction count displays correctly', async ({ page }) => {
    // Both people in the chat react with the same emoji: one pill counting 2, marked as yours.
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['👍'], [PRIMARY_USER]: ['👍'] });
    await expect(pill(reactions, '👍').locator('.cometchat-reactions__reaction-count')).toHaveText('2', { timeout: 15_000 });
    await expect(pill(reactions, '👍')).toHaveAttribute('aria-pressed', 'true');
  });

  // ==================== Clicking Reaction ====================

  test('clicking a reaction emoji toggles it', async ({ page }) => {
    // Clicking a reaction you haven't made adds yours. (Taking your own back by clicking its pill
    // is a known defect, covered by full-journey 27.1.)
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['🎉'] });
    const party = pill(reactions, '🎉');
    await expect(party).toHaveAttribute('aria-pressed', 'false', { timeout: 15_000 });
    await expect(party.locator('.cometchat-reactions__reaction-count')).toHaveText('1');

    await party.click();
    await expect(party).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
    await expect(party.locator('.cometchat-reactions__reaction-count')).toHaveText('2');
  });

  // ==================== Multiple Reactions ====================

  test('multiple reactions on same message display correctly', async ({ page }) => {
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['👍', '❤️', '😂'] });
    for (const emoji of ['👍', '❤️', '😂']) {
      await expect(pill(reactions, emoji)).toBeVisible({ timeout: 15_000 });
      await expect(pill(reactions, emoji).locator('.cometchat-reactions__reaction-count')).toHaveText('1');
    }
  });

  // ==================== Reaction Info (Hover/Tooltip) ====================

  test('hovering a reaction shows reaction info', async ({ page }) => {
    // Known UI Kit defect (ENG-40637): the hover popover never opens. Expected to fail until fixed.
    test.fail();
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['👍'] });
    await pill(reactions, '👍').hover();
    const info = page.locator('cometchat-reaction-info');
    await expect(info).toBeVisible({ timeout: 10_000 });
    await expect(info).toContainText(await getUserName(SECONDARY_USER), { timeout: 15_000 });
  });

  // ==================== Add Reaction via Message Actions ====================

  test('add reaction button appears on message hover', async ({ page }) => {
    const { row } = await messageWithReactions(page, {});
    const react = row.locator('.cometchat-message-bubble__options').getByRole('menuitem', { name: 'React', exact: true });
    await expect(async () => {
      await row.locator('.cometchat-message-bubble__body').first().hover();
      await expect(react).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  });

  test('clicking add reaction opens emoji picker', async ({ page }) => {
    const { row, reactions } = await messageWithReactions(page, {});
    const react = row.locator('.cometchat-message-bubble__options').getByRole('menuitem', { name: 'React', exact: true });
    await expect(async () => {
      await row.locator('.cometchat-message-bubble__body').first().hover();
      await react.click({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    const firstEmoji = page.locator('.cometchat-emoji-keyboard__list-item').first();
    await expect(firstEmoji).toBeVisible();
    // Picking an emoji reacts with it.
    const emoji = (await firstEmoji.textContent())!.trim();
    await firstEmoji.click();
    await expect(pill(reactions, emoji)).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  });

  // ==================== Reaction List ====================

  test('long-pressing a reaction shows reaction list', async ({ page }) => {
    // More reactions than the pills shown (at most 5): the rest sit behind a "+N" chip, which
    // opens the full list of who reacted with what.
    const { reactions } = await messageWithReactions(page, {
      [SECONDARY_USER]: ['👍', '❤️', '😂', '😮'],
      [PRIMARY_USER]: ['😢', '🙏', '🔥'],
    });
    const more = reactions.locator('.cometchat-reactions__more-reaction');
    await expect(more).toBeVisible({ timeout: 15_000 });
    await more.click();
    const list = page.locator('cometchat-reaction-list');
    await expect(list).toBeVisible();
    await expect(list).toContainText(await getUserName(SECONDARY_USER), { timeout: 15_000 });
    // The primary user's own reactions are listed as theirs.
    await expect(list).toContainText(/You/);
  });

  // ==================== Accessibility ====================

  test('reactions have proper ARIA attributes', async ({ page }) => {
    const { reactions } = await messageWithReactions(page, { [SECONDARY_USER]: ['👍'] });
    await expect(reactions.getByRole('group', { name: 'Message reactions' })).toBeVisible({ timeout: 15_000 });
    const thumbs = pill(reactions, '👍');
    // A button named for its emoji and count, which says whether you reacted.
    await expect(thumbs).toHaveAttribute('type', 'button');
    await expect(thumbs).toHaveAttribute('aria-label', /👍/);
    await expect(thumbs).toHaveAttribute('aria-pressed', 'false');
  });

  test('the "+N more" chip is named with its count', async ({ page }) => {
    // Known UI Kit defect (ENG-40638): it is named "+4 +{count} more reactions". Expected to fail
    // until fixed.
    test.fail();
    const { reactions } = await messageWithReactions(page, {
      [SECONDARY_USER]: ['👍', '❤️', '😂', '😮'],
      [PRIMARY_USER]: ['😢', '🙏', '🔥'],
    });
    const more = reactions.locator('.cometchat-reactions__more-reaction');
    await expect(more).toBeVisible({ timeout: 15_000 });
    const count = (await more.locator('.cometchat-reactions__more-reaction-count').textContent())!.trim().replace('+', '');
    await expect(more).toHaveAttribute('aria-label', `+${count} more reactions`);
  });
});
