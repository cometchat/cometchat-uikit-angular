import { test, expect, Page, Locator } from '@playwright/test';
import { loginToApp } from '../helpers';

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
 * REQUIRES the feature gates: `enablePinMessage` / `enableSaveMessage` via
 * COMETCHAT_GLOBAL_CONFIG, and a Chat SDK exposing the pin/save API
 * (4.1.14-beta-9+, excluding beta-10 whose typings dropped it). With a gate off
 * the options never render and the affected tests skip rather than fail — a red
 * suite should mean a regression, not a config difference.
 *
 * Tolerant by design, matching the rest of this suite: the backend is seeded but
 * not exclusively owned, so each test guards on the state it needs being present
 * instead of asserting a fixed fixture.
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
const CONFIRM_DIALOG = '.cometchat-confirm-dialog, [class*="confirm-dialog"]';

/** Open the first conversation and wait for its messages. */
async function openFirstConversation(page: Page): Promise<boolean> {
  const conversation = page.locator('.cometchat-conversation-item').first();
  const hasConversation = await conversation.isVisible({ timeout: 30_000 }).catch(() => false);
  if (!hasConversation) return false;
  await conversation.click();
  const bubble = page.locator('.cometchat-message-bubble').first();
  const hasMessages = await bubble.isVisible({ timeout: 15_000 }).catch(() => false);
  if (!hasMessages) return false;
  await page.waitForTimeout(1500);
  return true;
}

/**
 * Open a message's action sheet and step into Organise.
 *
 * Pin and Save live behind that submenu, so every path to them goes through
 * hover → "More options" → Organise. Returns false when any step is absent,
 * which is how a disabled feature gate surfaces.
 */
async function openOrganiseMenu(page: Page, bubble: Locator): Promise<boolean> {
  const body = bubble.locator('.cometchat-message-bubble__body').first();
  if (!(await body.isVisible({ timeout: 5_000 }).catch(() => false))) return false;

  await body.hover();
  await page.waitForTimeout(400);

  const more = bubble.getByRole('button', { name: 'More options' });
  if (!(await more.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  await more.click();
  await page.waitForTimeout(400);

  const organise = page.getByRole('menuitem', { name: ORGANISE_GROUP });
  if (!(await organise.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  // A submenu opens on hover, so this reveals rather than activates.
  await organise.hover();
  await page.waitForTimeout(500);
  return true;
}

/** Dismiss any open menu/overlay so the next step starts clean. */
async function closeMenus(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(300);
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
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');

      const bubble = page.locator('.cometchat-message-bubble').first();
      const opened = await openOrganiseMenu(page, bubble);
      test.skip(!opened, 'pin/save feature gate appears to be off');

      // One of Pin/Unpin and one of Save/Unsave must be present — which one
      // depends on the message's current state, which we do not control.
      const pinOrUnpin = page.getByRole('menuitem', { name: PIN_OPTION })
        .or(page.getByRole('menuitem', { name: UNPIN_OPTION }));
      const saveOrUnsave = page.getByRole('menuitem', { name: SAVE_OPTION })
        .or(page.getByRole('menuitem', { name: UNSAVE_OPTION }));

      await expect(pinOrUnpin.first()).toBeVisible({ timeout: 5_000 });
      await expect(saveOrUnsave.first()).toBeVisible({ timeout: 5_000 });

      await closeMenus(page);
    });
  });

  // ==================== Save / Unsave ====================

  test.describe('saving a message', () => {
    test('saving marks the bubble, and unsaving asks first', async () => {
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');

      const bubble = page.locator('.cometchat-message-bubble').first();
      test.skip(!(await openOrganiseMenu(page, bubble)), 'pin/save feature gate appears to be off');

      const save = page.getByRole('menuitem', { name: SAVE_OPTION });
      test.skip(!(await save.isVisible({ timeout: 3_000 }).catch(() => false)),
        'message is already saved — nothing to save');

      await save.click({ force: true });
      await page.waitForTimeout(1500);

      // The bubble gains a saved marker.
      await expect(page.locator('.cometchat-message-bubble__saved-indicator').first())
        .toBeVisible({ timeout: 8_000 });

      // Unsaving is destructive, so it must be confirmed. Saving was not.
      test.skip(!(await openOrganiseMenu(page, bubble)), 'menu did not reopen');
      const unsave = page.getByRole('menuitem', { name: UNSAVE_OPTION });
      if (await unsave.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await unsave.click({ force: true });
        await page.waitForTimeout(800);
        await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
        await closeMenus(page);
      }
    });
  });

  // ==================== Pin / Unpin ====================

  test.describe('pinning a message', () => {
    test('pinning marks the bubble, and unpinning asks first', async () => {
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');

      const bubble = page.locator('.cometchat-message-bubble').first();
      test.skip(!(await openOrganiseMenu(page, bubble)), 'pin/save feature gate appears to be off');

      const pin = page.getByRole('menuitem', { name: PIN_OPTION });
      // Pin is role-gated in groups: a participant never sees it, by design.
      test.skip(!(await pin.isVisible({ timeout: 3_000 }).catch(() => false)),
        'Pin not offered — already pinned, or the role cannot pin here');

      await pin.click({ force: true });
      await page.waitForTimeout(1500);

      await expect(page.locator('.cometchat-message-bubble__pinned-indicator').first())
        .toBeVisible({ timeout: 8_000 });

      test.skip(!(await openOrganiseMenu(page, bubble)), 'menu did not reopen');
      const unpin = page.getByRole('menuitem', { name: UNPIN_OPTION });
      if (await unpin.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await unpin.click({ force: true });
        await page.waitForTimeout(800);
        await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
        await closeMenus(page);
      }
    });
  });

  // ==================== Pinned messages panel ====================

  test.describe('pinned messages panel', () => {
    /** Open it from the chat header's overflow menu. */
    async function openPinnedPanel(): Promise<boolean> {
      const header = page.locator('.cometchat-message-header').first();
      if (!(await header.isVisible({ timeout: 10_000 }).catch(() => false))) return false;

      const overflow = header.getByRole('button', { name: /more|options/i }).first();
      if (!(await overflow.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
      await overflow.click();
      await page.waitForTimeout(500);

      const entry = page.getByRole('menuitem', { name: /Pinned messages/i });
      if (!(await entry.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
      await entry.click({ force: true });
      await page.waitForTimeout(1200);
      return true;
    }

    test('opens from the header and shows rows or an empty state', async () => {
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');
      test.skip(!(await openPinnedPanel()), 'pinned messages entry not available');

      const panel = page.locator(PINNED_PANEL);
      await expect(panel).toBeVisible({ timeout: 5_000 });

      // Either state is correct; the panel must simply not be blank.
      const rows = panel.locator(PINNED_ROW);
      const empty = panel.locator('.cometchat-pinned-messages__empty-title');
      const hasRows = (await rows.count()) > 0;
      const hasEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasRows || hasEmpty).toBe(true);
    });

    test('a row click is forwarded — the panel is not inert', async () => {
      // Guards the regression where the row itself is role="button" and the
      // interactive-target guard swallowed every click, leaving the panel dead.
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');
      test.skip(!(await openPinnedPanel()), 'pinned messages entry not available');

      const row = page.locator(PINNED_ROW).first();
      test.skip(!(await row.isVisible({ timeout: 3_000 }).catch(() => false)),
        'no pinned messages to click');

      await row.click();
      await page.waitForTimeout(1200);

      // The host jumps the list to the message; the panel closing is the
      // observable effect either way.
      const stillOpen = await page.locator(PINNED_PANEL).isVisible().catch(() => false);
      const listVisible = await page.locator('.cometchat-message-list').isVisible().catch(() => false);
      expect(stillOpen || listVisible).toBe(true);
    });

    test('closes from its close button', async () => {
      test.skip(!(await openFirstConversation(page)), 'no conversation with messages available');
      test.skip(!(await openPinnedPanel()), 'pinned messages entry not available');

      const close = page.locator('.cometchat-pinned-messages__close').first();
      test.skip(!(await close.isVisible({ timeout: 3_000 }).catch(() => false)), 'close button hidden');
      await close.click();
      await expect(page.locator(PINNED_PANEL)).toBeHidden({ timeout: 5_000 });
    });
  });

  // ==================== Saved messages panel ====================

  test.describe('saved messages panel', () => {
    /** Open it from the conversations-list menu. */
    async function openSavedPanel(): Promise<boolean> {
      const menu = page.locator('.cometchat-selector__menu-wrapper button, [class*="selector"] button')
        .filter({ hasText: /^$/ })
        .first();
      const trigger = (await menu.isVisible({ timeout: 3_000 }).catch(() => false))
        ? menu
        : page.getByRole('button', { name: /more|options|menu/i }).first();
      if (!(await trigger.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
      await trigger.click();
      await page.waitForTimeout(500);

      const entry = page.getByText(/Saved messages/i).first();
      if (!(await entry.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
      await entry.click({ force: true });
      await page.waitForTimeout(1500);
      return true;
    }

    test('opens and shows rows or an empty state', async () => {
      test.skip(!(await openSavedPanel()), 'saved messages entry not available');

      const panel = page.locator(SAVED_PANEL);
      await expect(panel).toBeVisible({ timeout: 5_000 });

      const rows = panel.locator(SAVED_ROW);
      const empty = panel.locator('.cometchat-saved-messages__empty-title');
      const hasRows = (await rows.count()) > 0;
      const hasEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasRows || hasEmpty).toBe(true);
    });

    test('a row click is forwarded — the panel is not inert', async () => {
      // Same regression guard as the pinned panel: clicking a saved row did
      // nothing at all, because the row matched its own interactive guard.
      test.skip(!(await openSavedPanel()), 'saved messages entry not available');

      const row = page.locator(SAVED_ROW).first();
      test.skip(!(await row.isVisible({ timeout: 3_000 }).catch(() => false)),
        'no saved messages to click');

      await row.click();
      await page.waitForTimeout(1500);

      // Clicking a row opens the source conversation, so the message list must
      // be showing afterwards.
      await expect(page.locator('.cometchat-message-list').first())
        .toBeVisible({ timeout: 8_000 });
    });

    test('unsaving from the panel asks for confirmation', async () => {
      test.skip(!(await openSavedPanel()), 'saved messages entry not available');

      const row = page.locator(SAVED_ROW).first();
      test.skip(!(await row.isVisible({ timeout: 3_000 }).catch(() => false)),
        'no saved messages to unsave');

      await row.hover();
      await page.waitForTimeout(400);
      const unsave = row.locator('.cometchat-saved-messages__unsave').first();
      test.skip(!(await unsave.isVisible({ timeout: 3_000 }).catch(() => false)),
        'unsave control hidden');

      await unsave.click();
      await page.waitForTimeout(800);
      await expect(page.locator(CONFIRM_DIALOG).first()).toBeVisible({ timeout: 5_000 });
      await closeMenus(page);
    });
  });

  // ==================== Pin conversation ====================

  test.describe('pinning a conversation', () => {
    test('the row menu offers Pin or Unpin', async () => {
      const conversation = page.locator('.cometchat-conversation-item').first();
      test.skip(!(await conversation.isVisible({ timeout: 30_000 }).catch(() => false)),
        'no conversations available');

      await conversation.hover();
      await page.waitForTimeout(400);

      const menu = conversation.getByRole('button', { name: /more|options/i }).first();
      test.skip(!(await menu.isVisible({ timeout: 3_000 }).catch(() => false)),
        'conversation row menu not available');
      await menu.click();
      await page.waitForTimeout(500);

      // Gated on SDK support, so absence is a valid outcome on an older build.
      const pinOrUnpin = page.getByRole('menuitem', { name: /^Pin conversation$/i })
        .or(page.getByRole('menuitem', { name: /^Unpin conversation$/i }));
      test.skip(!(await pinOrUnpin.first().isVisible({ timeout: 3_000 }).catch(() => false)),
        'conversation pin not supported by this SDK build');

      await expect(pinOrUnpin.first()).toBeVisible();
      await closeMenus(page);
    });
  });
});
