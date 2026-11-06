import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — Thread subscription (follow / unfollow)
 *
 * Covers the two surfaces the UI Kit ships: the `threadSubscription` option in
 * the message action sheet, and the bell control in the thread header. No
 * threads-list component exists, so nothing here exercises one.
 *
 * The sample app turns the feature on (`enableThreadSubscription: true` in its
 * app config) and the Chat SDK exposes the thread API, so both surfaces must
 * render: a missing option or bell is a failure, never a skip.
 *
 * Each test starts from its own message: before login the secondary user sends
 * a fresh text to the primary user over REST, so the primary user has never
 * followed its thread and it has no replies.
 *
 * @see ENG-37617
 */

// The action sheet names the ACTION; the header names it too, but as a tooltip.
const FOLLOW_OPTION = /Subscribe to thread/i;
const UNFOLLOW_OPTION = /Unsubscribe from thread/i;
const EITHER_OPTION = /Subscribe to thread|Unsubscribe from thread/i;
const MUTE_TOOLTIP = 'Unsubscribe from thread';
const UNMUTE_TOOLTIP = 'Subscribe to thread';

const SUBSCRIPTION_BUTTON = '.cometchat-thread-header__subscription-button';

const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const threadPanel = (page: Page) => page.locator('.cometchat-threaded-messages');
const threadList = (page: Page) => threadPanel(page).locator('cometchat-message-list');

/**
 * The open action sheet. Its overflow list is portaled to <body> when it opens,
 * so it is never inside the message row; closed sheets stay in the DOM hidden.
 */
const sheet = (page: Page) => page.locator('.cometchat-menu-list__sub-menu-list[data-visible="true"]');

/** The main-list row of the most recent message containing `text`. */
const mainRow = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

/**
 * Opens the action sheet on a message row. The options only appear while the
 * bubble body is hovered, and a hover that lands mid-render can be dropped, so
 * retry until the overflow menu shows Copy (every text message has it).
 */
async function openMessageOptions(page: Page, row: Locator): Promise<void> {
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.scrollIntoViewIfNeeded();
  await expect(async () => {
    await row.locator('.cometchat-message-bubble__body').first().hover();
    await row.getByRole('button', { name: /More options/i }).click({ timeout: 2_000 });
    await expect(sheet(page).getByRole('menuitem', { name: 'Copy' })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

async function closeMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  const overlay = page.locator('.cometchat-popover__overlay');
  if (await overlay.first().isVisible().catch(() => false)) await overlay.first().click();
  await expect(sheet(page)).toHaveCount(0);
}

/** Follow the message's thread from its action sheet and wait for the title to flip. */
async function followFromSheet(page: Page, row: Locator): Promise<void> {
  await openMessageOptions(page, row);
  await sheet(page).getByRole('menuitem', { name: FOLLOW_OPTION }).click({ force: true });
  // The server's ack shows as a toast. Until then a second toggle is swallowed (one request in
  // flight per thread), so a test that unfollows next must wait for it.
  await expect(page.getByText(/Subscribed\. You'll be notified about new replies/i)).toBeVisible({ timeout: 15_000 });
  // Toggle is debounced (400ms) before the request goes out; reopen until the ack lands.
  await expect(async () => {
    await closeMenu(page);
    await openMessageOptions(page, row);
    await expect(sheet(page).getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await closeMenu(page);
}

/**
 * Start the thread on a message via its "Reply in thread" option, and wait for the thread's
 * first load: a reply sent before that load completes can be sent but never shown (known UI
 * Kit defect), which would fail a test for the wrong reason.
 */
async function openThread(page: Page, text: string): Promise<void> {
  const row = mainRow(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  const parentId = await row.getAttribute('data-message-id');
  const firstLoad = page.waitForResponse(
    (r) => r.request().method() === 'GET' && r.url().includes(`/messages/${parentId}/thread`),
    { timeout: 30_000 }
  );
  await expect(async () => {
    await row.locator('.cometchat-message-bubble__body').first().hover();
    // A quick option on the row by default; in the overflow sheet if quick options are fewer.
    const quick = row.getByRole('menuitem', { name: 'Reply in thread' });
    if (await quick.count()) {
      await quick.click({ timeout: 2_000 });
    } else {
      await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await sheet(page).getByRole('menuitem', { name: 'Reply in thread' }).click({ timeout: 2_000 });
    }
    await expect(threadPanel(page)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await expect(threadPanel(page).locator('cometchat-thread-header')).toContainText(text);
  await firstLoad;
}

test.describe('Thread subscription', () => {
  let page: Page;
  /** The fresh message this test acts on, sent by the secondary user. */
  let parentText: string;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    parentText = `e2e thread-subscription parent ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parentText);
    await loginToApp(page);
    await openConversation(page, await getUserName(SECONDARY_USER));
    await scrollToLatestMessage(page);
  });

  // ==================== Action sheet ====================

  test('offers the follow option on a message', async () => {
    const row = mainRow(page, parentText);
    await openMessageOptions(page, row);

    // One option id, so exactly one of the two titles is present — never both.
    await expect(sheet(page).getByRole('menuitem', { name: EITHER_OPTION })).toHaveCount(1);
    await expect(sheet(page).getByRole('menuitem', { name: FOLLOW_OPTION })).toBeVisible();
  });

  test('sits immediately after Reply in thread', async () => {
    const row = mainRow(page, parentText);
    await openMessageOptions(page, row);

    // Quick options are icon-only, so read every entry's accessible name: the
    // row's quick options first, then the overflow sheet, in display order.
    const labels = (items: Element[]) => items.map(item => item.getAttribute('aria-label') ?? '');
    const titles = [
      ...(await row.locator('.cometchat-menu-list__main-menu-item').evaluateAll(labels)),
      ...(await sheet(page).getByRole('menuitem').evaluateAll(labels)),
    ];
    const replyIdx = titles.findIndex(t => /Reply in thread/i.test(t));
    expect(replyIdx).toBeGreaterThan(-1);

    const next = titles[replyIdx + 1] ?? '';
    expect(next).toMatch(EITHER_OPTION);
  });

  test('is offered even on a message with zero replies', async () => {
    // The whole point of the option: follow before anyone has answered.
    const row = mainRow(page, parentText);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.locator('cometchat-thread-view')).toHaveCount(0);

    await openMessageOptions(page, row);
    await expect(sheet(page).getByRole('menuitem', { name: EITHER_OPTION })).toBeVisible();
    await closeMenu(page);
  });

  test('title flips to Unsubscribe from thread after following', async () => {
    const row = mainRow(page, parentText);
    await openMessageOptions(page, row);

    const follow = sheet(page).getByRole('menuitem', { name: FOLLOW_OPTION });
    await expect(follow).toBeVisible();
    await follow.click({ force: true });

    // Toggle is debounced (400ms) before the request goes out; reopen until the ack lands.
    await expect(async () => {
      await closeMenu(page);
      await openMessageOptions(page, row);
      await expect(sheet(page).getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await closeMenu(page);
  });

  test('unfollowing confirms with a toast that does not promise permanence', async () => {
    const row = mainRow(page, parentText);
    await followFromSheet(page, row);

    await openMessageOptions(page, row);
    await sheet(page).getByRole('menuitem', { name: UNFOLLOW_OPTION }).click({ force: true });

    // Copy must say replies stop for now, not that the user is permanently opted
    // out — replying or being mentioned re-subscribes them.
    await expect(page.getByText(/Notifications are off until you reply or are mentioned/i)).toBeVisible({
      timeout: 6_000,
    });
  });

  // ==================== Thread header ====================

  test('header renders the bell in the top bar, not the reply-count row', async () => {
    await openThread(page, parentText);

    // Beside the close button in the top-bar actions, per the design.
    await expect(page.locator(`.cometchat-thread-header__top-bar-actions ${SUBSCRIPTION_BUTTON}`)).toBeVisible();
    await expect(page.locator(`.cometchat-thread-header__reply-count ${SUBSCRIPTION_BUTTON}`)).toHaveCount(0);
  });

  test('bell tooltip and accessible name are the same string', async () => {
    await openThread(page, parentText);
    const bell = page.locator(SUBSCRIPTION_BUTTON);
    await expect(bell).toBeVisible();

    const title = await bell.getAttribute('title');
    const ariaLabel = await bell.getAttribute('aria-label');

    // Divergence here is the WCAG 2.5.3 failure this pairing exists to prevent.
    expect(title).toBe(ariaLabel);
    expect([MUTE_TOOLTIP, UNMUTE_TOOLTIP]).toContain(title);
  });

  test('bell flips state, tooltip and aria-pressed together', async () => {
    await openThread(page, parentText);
    const bell = page.locator(SUBSCRIPTION_BUTTON);
    await expect(bell).toBeVisible();

    const before = await bell.getAttribute('title');
    await bell.click();

    // Optimistic, so the label flips immediately — no need to wait for the ack.
    await expect(bell).not.toHaveAttribute('title', before ?? '');
    const after = await bell.getAttribute('title');
    expect(await bell.getAttribute('aria-pressed')).toBe(String(after === MUTE_TOOLTIP));
  });

  test('control stays enabled in every state', async () => {
    await openThread(page, parentText);
    const bell = page.locator(SUBSCRIPTION_BUTTON);
    await expect(bell).toBeVisible();

    // UNKNOWN renders as un-followed and ENABLED — a disabled control on a
    // deep-linked thread would be a dead end.
    await expect(bell).toBeEnabled();
  });

  // ==================== The two surfaces agreeing ====================

  test('following from the header is reflected in the in-thread action sheet', async () => {
    await openThread(page, parentText);

    // A reply inside the thread gives the in-thread sheet something to open on.
    const replyText = `e2e thread-subscription reply ${uniqueTag()}`;
    await threadPanel(page).locator('cometchat-message-composer [contenteditable="true"]').first().click();
    await page.keyboard.type(replyText);
    await page.keyboard.press('Enter');
    const reply = threadList(page).locator('.cometchat-message-list__message').filter({ hasText: replyText }).last();
    await expect(reply).toBeVisible({ timeout: 30_000 });

    // Drive the header into the followed state.
    const bell = page.locator(SUBSCRIPTION_BUTTON);
    await expect(bell).toBeVisible();
    if ((await bell.getAttribute('title')) === UNMUTE_TOOLTIP) {
      await bell.click();
    }
    await expect(bell).toHaveAttribute('title', MUTE_TOOLTIP, { timeout: 5_000 });

    // The reply offers the option too, targeting the PARENT thread — so it must
    // already read as followed, with no refetch.
    await openMessageOptions(page, reply);
    await expect(sheet(page).getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({ timeout: 5_000 });
    await closeMenu(page);
  });

  // ==================== QA regressions ====================

  /**
   * The option was gated on the conversation being a group, so it never
   * appeared in a direct chat — QA's ENG-38909. Subscription decides whether a
   * thread's replies reach you, which is as true in a 1:1 as in a group.
   */
  test('is offered in a 1:1 chat, not only in a group', async () => {
    // beforeEach opened the 1:1 chat with the secondary user.
    const row = mainRow(page, parentText);
    await openMessageOptions(page, row);

    // Exactly one of the two titles, same as in a group — the 1:1 case is not
    // a degraded variant, it is the same control.
    await expect(sheet(page).getByRole('menuitem', { name: EITHER_OPTION })).toHaveCount(1);
    await closeMenu(page);
  });

  /**
   * Sending subscribes the author to that message's thread server-side, but the
   * send response does not carry the flag back — so the just-sent bubble used to
   * offer "Subscribe to thread" on a thread its own author had already joined.
   * QA's ENG-38910. Checked on a top-level send, which is the case that was
   * missed: the composer only stamped replies.
   */
  test('a just-sent message already reads as followed @quarantine (ENG-40630)', async () => {
    // @quarantine: intermittent UI Kit defect (ENG-40630). The sent message appears, then the
    // list sometimes jumps back to an older page and the message leaves view, so it can't be
    // opened. Failed 1 of ~15 runs (both attempts), so it can't be test.fail.
    const composer = page.locator('cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible({ timeout: 8_000 });

    const sentText = `e2e thread-subscription sent ${uniqueTag()}`;
    await input.click();
    await page.keyboard.type(sentText);
    await page.keyboard.press('Enter');

    const sent = mainRow(page, sentText);
    await expect(sent).toBeVisible({ timeout: 15_000 });
    await openMessageOptions(page, sent);

    // Reads the state the server already holds, without waiting for a refetch.
    await expect(sheet(page).getByRole('menuitem', { name: UNFOLLOW_OPTION })).toBeVisible({ timeout: 5_000 });
    await expect(sheet(page).getByRole('menuitem', { name: FOLLOW_OPTION })).toHaveCount(0);
    await closeMenu(page);
  });
});
