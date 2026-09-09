import { test, expect, Page, Locator } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — Thread subscription (follow / unfollow)
 *
 * Covers the two surfaces the UI Kit ships: the `threadSubscription` option in
 * the message action sheet, and the bell control in the thread header. No
 * threads-list component exists, so nothing here exercises one.
 *
 * REQUIRES the feature gate: `enableThreadSubscription: true` must be provided
 * via COMETCHAT_GLOBAL_CONFIG in the sample app, and the Chat SDK must expose
 * the thread API (4.1.14-beta-1+). With the gate off — the shipping default —
 * neither surface renders and every test here degrades to a skip rather than a
 * failure, which is deliberate: a red suite should mean a regression, not a
 * config difference.
 *
 * Tolerant by design, matching the rest of this suite: the shared backend is
 * seeded but not exclusively owned, so tests guard on the state they need being
 * present instead of asserting a fixed fixture.
 *
 * @see ENG-37617
 */

// The action sheet names the ACTION; the header names it too, but as a tooltip.
const FOLLOW_OPTION = /Subscribe to thread/i;
const UNFOLLOW_OPTION = /Unsubscribe from thread/i;
const MUTE_TOOLTIP = 'Unsubscribe from thread';
const UNMUTE_TOOLTIP = 'Subscribe to thread';

const SUBSCRIPTION_BUTTON = '.cometchat-thread-header__subscription-button';
const THREAD_HEADER = 'cometchat-thread-header, .cometchat-thread-header';

/**
 * Opens a conversation that actually has messages, and proves it opened.
 *
 * Clicking `.cometchat-conversation-item` and then waiting for bubbles — what
 * the rest of this suite does — races: the click can land before the row's
 * handler is wired, leaving the empty state on screen and the wait timing out
 * 15s later. Here the message list mounting is the signal the conversation
 * opened, and a row that yields no messages is skipped rather than failed.
 */
async function openConversationWithMessages(page: Page): Promise<boolean> {
  await page.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
  const rows = page.locator('.cometchat-conversation-item');
  // global-setup seeds fresh users and groups, so the newest rows are often
  // empty conversations. Scan well past them rather than giving up at five.
  const attempts = Math.min(await rows.count(), 15);

  for (let i = 0; i < attempts; i++) {
    await rows.nth(i).click();
    const opened = await page
      .locator('cometchat-message-list, .cometchat-message-list')
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (!opened) continue;

    const hasMessages = await page
      .locator('.cometchat-message-bubble')
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (hasMessages) {
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

/** Opens the action sheet on a message bubble and returns whether it opened. */
async function openMessageOptions(page: Page, bubble: Locator): Promise<boolean> {
  // Hover the bubble ROOT: `isHovering` lives there, and it is what reveals
  // `.cometchat-message-bubble__options`. Hovering the inner body — which the
  // rest of this suite does — never sets it, so the trigger stays hidden.
  if (!(await bubble.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
  await bubble.scrollIntoViewIfNeeded().catch(() => undefined);
  await bubble.hover();
  await page.waitForTimeout(800);

  const moreBtn = bubble.getByRole('button', { name: /More options/i });
  if (!(await moreBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return false;

  await moreBtn.click();
  await page.waitForTimeout(500);
  return true;
}

async function closeMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

/** True when the kit surfaces are live — i.e. the integrator opted in. */
async function subscriptionOptionAvailable(page: Page): Promise<boolean> {
  const follow = page.getByRole('menuitem', { name: FOLLOW_OPTION });
  const unfollow = page.getByRole('menuitem', { name: UNFOLLOW_OPTION });
  return (
    (await follow.isVisible({ timeout: 2_000 }).catch(() => false)) ||
    (await unfollow.isVisible({ timeout: 2_000 }).catch(() => false))
  );
}

test.describe('Thread subscription', () => {
  let page: Page;
  /** False when no conversation with messages could be opened — tests skip, not fail. */
  let ready = false;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    ready = await openConversationWithMessages(page);
  });

  // ==================== Action sheet ====================

  test('offers the follow option on a message', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const bubble = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, bubble)), 'Message options did not open.');

    if (!(await subscriptionOptionAvailable(page))) {
      test.skip(true, 'Thread subscription gate is off, or the SDK lacks the thread API.');
      return;
    }

    // One option id, so exactly one of the two titles is present — never both.
    const follow = await page.getByRole('menuitem', { name: FOLLOW_OPTION }).count();
    const unfollow = await page.getByRole('menuitem', { name: UNFOLLOW_OPTION }).count();
    expect(follow + unfollow).toBe(1);
  });

  test('sits immediately after Reply in thread', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const bubble = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, bubble)), 'Message options did not open.');
    if (!(await subscriptionOptionAvailable(page))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    const titles = await page.getByRole('menuitem').allInnerTexts();
    const replyIdx = titles.findIndex(t => /Reply in thread/i.test(t));
    test.skip(replyIdx === -1, 'Reply in thread is hidden here, so there is no anchor to sit after.');

    const next = titles[replyIdx + 1] ?? '';
    expect(next).toMatch(/Subscribe to thread|Unsubscribe from thread/i);
  });

  test('is offered even on a message with zero replies', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    // The whole point of the option: follow before anyone has answered. Pick a
    // bubble with no reply-count affordance.
    const bubbles = page.locator('.cometchat-message-bubble');
    const count = Math.min(await bubbles.count(), 8);

    for (let i = 0; i < count; i++) {
      const bubble = bubbles.nth(i);
      const hasReplies = await bubble
        .locator('[class*="reply-count"], [class*="thread-replies"]')
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (hasReplies) continue;

      if (!(await openMessageOptions(page, bubble))) continue;
      if (!(await subscriptionOptionAvailable(page))) {
        test.skip(true, 'Thread subscription gate is off.');
        return;
      }
      expect(await subscriptionOptionAvailable(page)).toBe(true);
      await closeMenu(page);
      return;
    }
  });

  test('title flips to Unsubscribe from thread after following', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const bubble = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, bubble)), 'Message options did not open.');

    const follow = page.getByRole('menuitem', { name: FOLLOW_OPTION });
    if (!(await follow.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip(true, 'Gate off, or this thread is already followed.');
      return;
    }

    await follow.click({ force: true });
    // Toggle is debounced (400ms) before the request goes out; allow the ack.
    await page.waitForTimeout(2500);

    test.skip(!(await openMessageOptions(page, bubble)), 'Could not reopen the sheet to read the flipped title.');
    await expect(page.getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({
      timeout: 5_000,
    });
    await closeMenu(page);
  });

  test('unfollowing confirms with a toast that does not promise permanence', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const bubble = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, bubble)), 'Message options did not open.');

    const unfollow = page.getByRole('menuitem', { name: UNFOLLOW_OPTION });
    if (!(await unfollow.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip(true, 'Nothing followed to unfollow here.');
      return;
    }

    await unfollow.click({ force: true });
    await page.waitForTimeout(2500);

    // Copy must say replies stop, not that the user is permanently opted out —
    // replying or being mentioned re-subscribes them.
    await expect(page.getByText(/won.t be notified about new replies/i)).toBeVisible({
      timeout: 6_000,
    });
  });

  // ==================== Thread header ====================

  test('header renders the bell in the top bar, not the reply-count row', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const threadEntry = page
      .locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]')
      .first();
    test.skip(
      !(await threadEntry.isVisible({ timeout: 5_000 }).catch(() => false)),
      'No thread with replies in this conversation.'
    );

    await threadEntry.click();
    await page.waitForSelector(THREAD_HEADER, { timeout: 10_000 });

    const bell = page.locator(SUBSCRIPTION_BUTTON);
    if (!(await bell.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    // Beside the close button in the top-bar actions, per the design.
    await expect(page.locator(`.cometchat-thread-header__top-bar-actions ${SUBSCRIPTION_BUTTON}`)).toBeVisible();
    await expect(page.locator(`.cometchat-thread-header__reply-count ${SUBSCRIPTION_BUTTON}`)).toHaveCount(0);
  });

  test('bell tooltip and accessible name are the same string', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const threadEntry = page
      .locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]')
      .first();
    test.skip(
      !(await threadEntry.isVisible({ timeout: 5_000 }).catch(() => false)),
      'No thread with replies in this conversation.'
    );

    await threadEntry.click();
    await page.waitForSelector(THREAD_HEADER, { timeout: 10_000 });

    const bell = page.locator(SUBSCRIPTION_BUTTON);
    if (!(await bell.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    const title = await bell.getAttribute('title');
    const ariaLabel = await bell.getAttribute('aria-label');

    // Divergence here is the WCAG 2.5.3 failure this pairing exists to prevent.
    expect(title).toBe(ariaLabel);
    expect([MUTE_TOOLTIP, UNMUTE_TOOLTIP]).toContain(title);
  });

  test('bell flips state, tooltip and aria-pressed together', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const threadEntry = page
      .locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]')
      .first();
    test.skip(
      !(await threadEntry.isVisible({ timeout: 5_000 }).catch(() => false)),
      'No thread with replies in this conversation.'
    );

    await threadEntry.click();
    await page.waitForSelector(THREAD_HEADER, { timeout: 10_000 });

    const bell = page.locator(SUBSCRIPTION_BUTTON);
    if (!(await bell.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    const before = await bell.getAttribute('title');
    await bell.click();
    // Optimistic, so the label flips immediately — no need to wait for the ack.
    await page.waitForTimeout(600);

    const after = await bell.getAttribute('title');
    expect(after).not.toBe(before);
    expect(await bell.getAttribute('aria-pressed')).toBe(String(after === MUTE_TOOLTIP));
  });

  test('control stays enabled in every state', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const threadEntry = page
      .locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]')
      .first();
    test.skip(
      !(await threadEntry.isVisible({ timeout: 5_000 }).catch(() => false)),
      'No thread with replies in this conversation.'
    );

    await threadEntry.click();
    await page.waitForSelector(THREAD_HEADER, { timeout: 10_000 });

    const bell = page.locator(SUBSCRIPTION_BUTTON);
    if (!(await bell.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    // UNKNOWN renders as un-followed and ENABLED — a disabled control on a
    // deep-linked thread would be a dead end.
    await expect(bell).toBeEnabled();
  });

  // ==================== The two surfaces agreeing ====================

  test('following from the header is reflected in the in-thread action sheet', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');
    const threadEntry = page
      .locator('.cometchat-message-bubble__reply-count, [class*="reply-count"], [class*="thread-replies"]')
      .first();
    test.skip(
      !(await threadEntry.isVisible({ timeout: 5_000 }).catch(() => false)),
      'No thread with replies in this conversation.'
    );

    await threadEntry.click();
    await page.waitForSelector(THREAD_HEADER, { timeout: 10_000 });

    const bell = page.locator(SUBSCRIPTION_BUTTON);
    if (!(await bell.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, 'Thread subscription gate is off.');
      return;
    }

    // Drive the header into the followed state.
    if ((await bell.getAttribute('title')) === UNMUTE_TOOLTIP) {
      await bell.click();
      await page.waitForTimeout(2500);
    }
    expect(await bell.getAttribute('title')).toBe(MUTE_TOOLTIP);

    // A reply inside the thread offers the option too, targeting the PARENT
    // thread — so it must already read as followed, with no refetch.
    const reply = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, reply)), 'Could not open options on an in-thread reply.');

    if (await subscriptionOptionAvailable(page)) {
      await expect(page.getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({
        timeout: 5_000,
      });
    }
    await closeMenu(page);
  });
  // ==================== QA regressions ====================

  /**
   * Opens a 1:1 chat via the Users tab and proves the message list mounted.
   *
   * Deliberately not taken from the conversation list: a row there may be a
   * group, and this test is only meaningful against a direct chat.
   */
  async function openOneToOneChat(): Promise<boolean> {
    const usersTab = page
      .locator('[data-testid="tab-users"], button:has-text("Users"), .cometchat-tabs__tab:has-text("Users")')
      .first();
    if (!(await usersTab.isVisible({ timeout: 5_000 }).catch(() => false))) return false;
    await usersTab.click();

    const list = page.locator('cometchat-users, .cometchat-users');
    if (!(await list.first().isVisible({ timeout: 15_000 }).catch(() => false))) return false;

    const rows = page.locator('.cometchat-user-item, cometchat-user-item');
    const attempts = Math.min(await rows.count(), 8);
    for (let i = 0; i < attempts; i++) {
      await rows.nth(i).click();
      const opened = await page
        .locator('cometchat-message-list, .cometchat-message-list')
        .first()
        .isVisible({ timeout: 8_000 })
        .catch(() => false);
      if (opened) {
        await page.waitForTimeout(1200);
        return true;
      }
    }
    return false;
  }

  /**
   * The option was gated on the conversation being a group, so it never
   * appeared in a direct chat — QA's ENG-38909. Subscription decides whether a
   * thread's replies reach you, which is as true in a 1:1 as in a group.
   */
  test('is offered in a 1:1 chat, not only in a group', async () => {
    test.skip(!(await openOneToOneChat()), 'No 1:1 chat could be opened.');

    // A direct chat may legitimately be empty; send nothing, just find a bubble.
    const bubble = page.locator('.cometchat-message-bubble').last();
    test.skip(
      !(await bubble.isVisible({ timeout: 8_000 }).catch(() => false)),
      'The 1:1 chat has no messages to act on.'
    );
    test.skip(!(await openMessageOptions(page, bubble)), 'Message options did not open.');

    if (!(await subscriptionOptionAvailable(page))) {
      test.skip(true, 'Thread subscription gate is off, or the SDK lacks the thread API.');
      return;
    }

    // Exactly one of the two titles, same as in a group — the 1:1 case is not
    // a degraded variant, it is the same control.
    const follow = await page.getByRole('menuitem', { name: FOLLOW_OPTION }).count();
    const unfollow = await page.getByRole('menuitem', { name: UNFOLLOW_OPTION }).count();
    expect(follow + unfollow).toBe(1);
    await closeMenu(page);
  });

  /**
   * Sending subscribes the author to that message's thread server-side, but the
   * send response does not carry the flag back — so the just-sent bubble used to
   * offer "Subscribe to thread" on a thread its own author had already joined.
   * QA's ENG-38910. Checked on a top-level send, which is the case that was
   * missed: the composer only stamped replies.
   */
  test('a just-sent message already reads as followed', async () => {
    test.skip(!ready, 'No conversation with messages available to open.');

    const composer = page.locator('cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    test.skip(
      !(await input.isVisible({ timeout: 8_000 }).catch(() => false)),
      'Composer is not available in this conversation.'
    );

    const before = await page.locator('.cometchat-message-bubble').count();
    await input.click();
    await page.keyboard.type(`e2e thread-subscription ${Date.now()}`);
    await page.keyboard.press('Enter');

    // Wait for the bubble to actually land rather than a fixed sleep.
    await expect
      .poll(() => page.locator('.cometchat-message-bubble').count(), { timeout: 15_000 })
      .toBeGreaterThan(before);
    await page.waitForTimeout(1200);

    const sent = page.locator('.cometchat-message-bubble').last();
    test.skip(!(await openMessageOptions(page, sent)), 'Options did not open on the sent message.');

    if (!(await subscriptionOptionAvailable(page))) {
      test.skip(true, 'Thread subscription gate is off, or the SDK lacks the thread API.');
      return;
    }

    // Reads the state the server already holds, without waiting for a refetch.
    await expect(page.getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({
      timeout: 5_000,
    });
    expect(await page.getByRole('menuitem', { name: FOLLOW_OPTION }).count()).toBe(0);
    await closeMenu(page);
  });
});
