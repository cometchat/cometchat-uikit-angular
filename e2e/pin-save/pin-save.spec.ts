import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — Pin message, Save message, Pin conversation
 *
 * Covers the surfaces the UI Kit ships for this feature:
 *   - the Organise submenu in the message action sheet (Pin/Unpin, Save/Unsave)
 *   - the pinned/saved indicators on a message bubble
 *   - the Pinned Messages panel, opened from the chat header
 *   - the Saved Messages panel, opened from the conversations menu
 *   - the confirmation dialog, which guards REMOVAL only
 *   - Pin/Unpin conversation in the conversation row menu
 *
 * The sample app turns pin and save on (`enablePinMessage` / `enableSaveMessage`
 * in app.config.ts), so a missing control is a failure, never a skip. Pin
 * conversation follows the app's plan (`isPinConversationEnabled`), so it needs
 * the feature enabled for the E2E app in the CometChat dashboard.
 *
 * Every test works on a fresh message SECONDARY_USER sends to PRIMARY_USER over
 * REST, found by its unique text, so tests never depend on each other or on
 * whatever is already pinned or saved.
 *
 * @see ENG-37915
 */

// The action sheet names the ACTION, so these read as verbs.
const PIN_OPTION = /^Pin message$/i;
const UNPIN_OPTION = /^Unpin message$/i;
const SAVE_OPTION = /^Save message$/i;
const UNSAVE_OPTION = /^Unsave message$/i;
const ORGANISE_GROUP = /^Organise$/i;

const PINNED_PANEL = '.cometchat-pinned-messages';
const SAVED_PANEL = '.cometchat-saved-messages';
const PINNED_ROW = '.cometchat-pinned-messages__item';
const SAVED_ROW = '.cometchat-saved-messages__row';
const CONFIRM_DIALOG = '.cometchat-pin-save-confirm-dialog';

/** The list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

/**
 * Send a fresh message from George to Andrew, open their chat at the latest
 * message and return the message's row.
 */
async function openChatWithFreshMessage(page: Page, label: string): Promise<{ text: string; row: Locator }> {
  // Plain words only: moderation's AI scam rule blocked "Pin-save offer <tag>".
  const text = `Pin-save ${label} ${uniqueTag()}`;
  await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  return { text, row };
}

/**
 * Open a message's action sheet and step into Organise.
 *
 * Pin and Save live behind that submenu, so every path to them goes through
 * hover → "More options" → Organise. Retried as a whole: the hover that reveals
 * "More options" can be lost when the list re-renders.
 */
async function openOrganiseMenu(page: Page, row: Locator): Promise<void> {
  const organise = page.getByRole('menuitem', { name: ORGANISE_GROUP });
  await expect(async () => {
    await closeMenus(page);
    await row.locator('.cometchat-message-bubble__body').first().hover();
    await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
    await expect(organise).toBeVisible({ timeout: 2_000 });
    // A submenu opens on hover, so this reveals rather than activates.
    await organise.hover();
    const anyAction = page.getByRole('menuitem', { name: PIN_OPTION })
      .or(page.getByRole('menuitem', { name: UNPIN_OPTION }))
      .or(page.getByRole('menuitem', { name: SAVE_OPTION }))
      .or(page.getByRole('menuitem', { name: UNSAVE_OPTION }));
    await expect(anyAction.first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/** Pick `option` from a message's Organise submenu. */
async function organise(page: Page, row: Locator, option: RegExp): Promise<void> {
  await openOrganiseMenu(page, row);
  const item = page.getByRole('menuitem', { name: option });
  await expect(item).toBeVisible({ timeout: 5_000 });
  await item.click({ force: true });
}

/**
 * Pin or save a message from its Organise submenu and wait for the server to accept it.
 *
 * The bubble's marker appears optimistically, before the request returns, and is
 * withdrawn if the server refuses (e.g. the conversation's pin cap is full) — so the
 * marker alone cannot show that the action happened. The request's response can.
 */
async function organiseConfirmed(page: Page, row: Locator, action: 'pin' | 'save'): Promise<void> {
  const endpoint = new RegExp(`/messages/\\d+/${action}$`);
  const response = page.waitForResponse(
    (res) => res.request().method() === 'POST' && endpoint.test(new URL(res.url()).pathname)
  );
  await organise(page, row, action === 'pin' ? PIN_OPTION : SAVE_OPTION);
  const res = await response;
  expect(res.ok(), `${action} refused by the server: ${await res.text()}`).toBe(true);
}

/**
 * Dismiss any open message menu so the next step starts clean: Escape until neither the
 * "More options" menu (its Organise item) nor the Organise submenu (Pin/Save items) is showing.
 */
async function closeMenus(page: Page): Promise<void> {
  const open = page
    .getByRole('menuitem', { name: ORGANISE_GROUP })
    .or(page.getByRole('menuitem', { name: PIN_OPTION }))
    .or(page.getByRole('menuitem', { name: UNPIN_OPTION }))
    .or(page.getByRole('menuitem', { name: SAVE_OPTION }))
    .or(page.getByRole('menuitem', { name: UNSAVE_OPTION }))
    .filter({ visible: true });
  await expect(async () => {
    if (await open.count()) await page.keyboard.press('Escape');
    await expect(open).toHaveCount(0, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

/** Open the Pinned Messages panel from the chat header's "More options" menu. */
async function openPinnedPanel(page: Page): Promise<Locator> {
  const header = page.locator('cometchat-message-header');
  const entry = page.getByRole('menuitem', { name: /^Pinned messages$/i });
  await expect(async () => {
    await header.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
    await expect(entry).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await entry.click({ force: true });
  const panel = page.locator(PINNED_PANEL);
  await expect(panel).toBeVisible({ timeout: 10_000 });
  return panel;
}

/** Open the Saved Messages panel from the conversations-list menu. */
async function openSavedPanel(page: Page): Promise<Locator> {
  const entry = page.getByRole('menuitem', { name: /^Saved messages$/i });
  await expect(async () => {
    await page.getByRole('button', { name: 'CometChat Selector' }).click({ timeout: 2_000 });
    await expect(entry).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await entry.click({ force: true });
  const panel = page.locator(SAVED_PANEL);
  await expect(panel).toBeVisible({ timeout: 10_000 });
  return panel;
}

test.describe('Pin & Save', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
  });

  // ==================== Action sheet ====================

  test.describe('Organise submenu', () => {
    test('offers Pin and Save for a message', async () => {
      const { row } = await openChatWithFreshMessage(page, 'menu');

      await openOrganiseMenu(page, row);

      // A fresh message is neither pinned nor saved, so the verbs are fixed.
      await expect(page.getByRole('menuitem', { name: PIN_OPTION })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('menuitem', { name: SAVE_OPTION })).toBeVisible({ timeout: 5_000 });

      await closeMenus(page);
    });
  });

  // ==================== Save / Unsave ====================

  test.describe('saving a message', () => {
    test('saving marks the bubble, and unsaving asks first', async () => {
      const { row } = await openChatWithFreshMessage(page, 'save');

      await organiseConfirmed(page, row, 'save');

      // The bubble gains a saved marker.
      await expect(row.locator('.cometchat-message-bubble__saved-indicator')).toBeVisible({ timeout: 8_000 });

      // Unsaving is destructive, so it must be confirmed. Saving was not.
      await organise(page, row, UNSAVE_OPTION);
      await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
      await closeMenus(page);
    });
  });

  // ==================== Pin / Unpin ====================

  test.describe('pinning a message', () => {
    test('pinning marks the bubble, and unpinning asks first @smoke', async () => {
      const { row } = await openChatWithFreshMessage(page, 'pin');

      await organiseConfirmed(page, row, 'pin');

      await expect(row.locator('.cometchat-message-bubble__pinned-indicator')).toBeVisible({ timeout: 8_000 });

      await organise(page, row, UNPIN_OPTION);
      await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
      await closeMenus(page);
    });
  });

  // ==================== Pinned messages panel ====================

  test.describe('pinned messages panel', () => {
    test('opens from the header and lists a pinned message', async () => {
      const { text, row } = await openChatWithFreshMessage(page, 'pinned panel');
      await organiseConfirmed(page, row, 'pin');
      await expect(row.locator('.cometchat-message-bubble__pinned-indicator')).toBeVisible({ timeout: 8_000 });

      const panel = await openPinnedPanel(page);

      await expect(panel.locator(PINNED_ROW).filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
    });

    test('a row click is forwarded — the panel is not inert', async () => {
      // Guards the regression where the row itself is role="button" and the
      // interactive-target guard swallowed every click, leaving the panel dead.
      const { text, row } = await openChatWithFreshMessage(page, 'pinned click');
      await organiseConfirmed(page, row, 'pin');
      await expect(row.locator('.cometchat-message-bubble__pinned-indicator')).toBeVisible({ timeout: 8_000 });

      const panel = await openPinnedPanel(page);
      const pinnedRow = panel.locator(PINNED_ROW).filter({ hasText: text });
      await expect(pinnedRow).toBeVisible({ timeout: 10_000 });
      await pinnedRow.click();

      // The host jumps the list to the message, so it must be in view.
      await expect(rowWithText(page, text)).toBeInViewport({ timeout: 8_000 });
    });

    test('closes from its close button', async () => {
      await openConversation(page, await getUserName(SECONDARY_USER));
      const panel = await openPinnedPanel(page);

      const close = panel.locator('.cometchat-pinned-messages__close').first();
      await expect(close).toBeVisible({ timeout: 5_000 });
      await close.click();
      await expect(panel).toBeHidden({ timeout: 5_000 });
    });
  });

  // ==================== Saved messages panel ====================

  test.describe('saved messages panel', () => {
    /** Save a fresh message, then open the panel; returns the message's text and its row in the panel. */
    async function savedRowFor(label: string): Promise<{ text: string; savedRow: Locator }> {
      const { text, row } = await openChatWithFreshMessage(page, label);
      await organiseConfirmed(page, row, 'save');
      await expect(row.locator('.cometchat-message-bubble__saved-indicator')).toBeVisible({ timeout: 8_000 });

      const panel = await openSavedPanel(page);
      const savedRow = panel.locator(SAVED_ROW).filter({ hasText: text });
      await expect(savedRow).toBeVisible({ timeout: 10_000 });
      return { text, savedRow };
    }

    test('opens and lists a saved message', async () => {
      await savedRowFor('saved panel');
    });

    test('a row click is forwarded — the panel is not inert', async () => {
      // Same regression guard as the pinned panel: clicking a saved row did
      // nothing at all, because the row matched its own interactive guard.
      const { text, savedRow } = await savedRowFor('saved click');

      await savedRow.click();

      // Clicking a row opens the source conversation at that message.
      await expect(rowWithText(page, text)).toBeVisible({ timeout: 10_000 });
    });

    test('unsaving from the panel asks for confirmation', async () => {
      const { savedRow } = await savedRowFor('saved unsave');

      await savedRow.hover();
      const unsave = savedRow.locator('.cometchat-saved-messages__unsave').first();
      await expect(unsave).toBeVisible({ timeout: 5_000 });
      await unsave.click();

      await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
      await closeMenus(page);
    });
  });

  // ==================== Pin conversation ====================

  test.describe('pinning a conversation', () => {
    test('the row menu offers Pin or Unpin', async () => {
      // Needs Pin conversation enabled for the app in the CometChat dashboard.
      const conversation = conversationRow(page, await getUserName(SECONDARY_USER));
      await expect(conversation).toBeVisible({ timeout: 30_000 });

      const pinOrUnpin = page.getByRole('menuitem', { name: /^Pin conversation$/i })
        .or(page.getByRole('menuitem', { name: /^Unpin conversation$/i }));
      await expect(async () => {
        await conversation.hover();
        await conversation.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
        await expect(pinOrUnpin.first()).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await closeMenus(page);
    });
  });
});
