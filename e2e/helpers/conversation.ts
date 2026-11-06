import { Locator, Page, expect } from '@playwright/test';

/**
 * Conversation-list helpers shared by specs.
 */

/** Matches text that is exactly `name`, ignoring surrounding whitespace. */
function exactText(name: string): RegExp {
  return new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

/**
 * The conversation row titled `name` (user or group name). Matches the row's title exactly:
 * matching the whole row would also hit other rows whose preview mentions the name, e.g. a
 * group whose last message is "System added George Alan".
 */
export function conversationRow(page: Page, name: string): Locator {
  const exactName = exactText(name);
  return page
    .locator('.cometchat-conversation-item')
    .filter({ has: page.locator('.cometchat-conversation-item__title-text', { hasText: exactName }) })
    .first();
}

/**
 * Open the conversation named `name` and wait until its message list renders.
 *
 * Right after the home page loads, the sample app ignores clicks on conversation
 * rows for a few seconds, so a single click can be dropped. Re-click until the
 * message list is visible instead of sleeping for a fixed time.
 */
export async function openConversation(page: Page, name: string): Promise<Locator> {
  const row = conversationRow(page, name);
  const messageList = page.locator('cometchat-message-list');
  // The Chats list loads a page at a time. When a run has created many chats since this one
  // was last active, its row is not on the first page, so scroll the list down (loading the
  // next page) until the row appears, as a user would.
  const rows = page.locator('cometchat-conversations .cometchat-conversation-item');
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    if (!(await row.count())) {
      // Scroll the list's scroll container to its end, which loads the next page.
      await rows.last().evaluate((item) => {
        let el: HTMLElement | null = item.parentElement;
        while (el && el.scrollHeight <= el.clientHeight + 1) el = el.parentElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
    await expect(row).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  // Live events (a new message, a member added) can re-sort the list between locating the
  // row and clicking it, so confirm the header shows the intended conversation. Match the
  // title exactly: "George Alan" must not accept a chat named "George Alan Jr".
  // Always click once: the header can still show this chat while it is closing (the Chats tab
  // closes the open chat), so it can't tell us the chat is open. After that, click again only
  // while the header shows another chat: re-clicking a chat that is still opening starts a
  // second load of its messages, and when that lands after a send it drops the sent message
  // from the list (ENG-40618).
  const headerTitle = page.locator('cometchat-message-header .cometchat-message-header__title').first();
  await row.click();
  await expect(async () => {
    const shown = await headerTitle.textContent({ timeout: 500 }).catch(() => null);
    if (shown?.trim() !== name) await row.click();
    await expect(messageList).toBeVisible({ timeout: 2_000 });
    await expect(headerTitle).toHaveText(exactText(name), { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return messageList;
}

/**
 * Bring the open conversation to its latest message.
 *
 * A conversation with unread messages opens scrolled up at the "New" divider, and
 * while scrolled up the list does not render newly received messages. Tests that
 * assert on incoming messages must start from the bottom.
 */
export async function scrollToLatestMessage(page: Page): Promise<void> {
  const scrollToBottom = page.locator('.cometchat-message-list__scroll-to-bottom');
  // Wait for the first render; checking earlier sees no button and returns too soon.
  await expect(page.locator('cometchat-message-list .cometchat-message-list__message').first()).toBeVisible({
    timeout: 30_000,
  });
  // The stability check below keeps its state on window; start each call from zero so a
  // count left by an earlier call can't end this one early.
  await page.evaluate(() => {
    const w = window as unknown as { __e2eListSig?: string; __e2eListStable?: number };
    w.__e2eListSig = undefined;
    w.__e2eListStable = 0;
  });
  await expect(async () => {
    if (await scrollToBottom.isVisible()) {
      await scrollToBottom.locator('cometchat-button').click();
    }
    // After opening, the list first renders around the "New" divider and then loads the
    // latest page, moving the scroll position for a second or two. Wait until it is at
    // the bottom and has stopped moving, or a later scroll overrides what the test does.
    await page.waitForFunction(
      () => {
        const el = document.querySelector('cometchat-message-list .cometchat-message-list__container');
        if (!el) return false;
        const w = window as unknown as { __e2eListSig?: string; __e2eListStable?: number };
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
        const sig = `${el.scrollTop}|${el.scrollHeight}`;
        w.__e2eListStable = atBottom && w.__e2eListSig === sig ? (w.__e2eListStable ?? 0) + 1 : 0;
        w.__e2eListSig = sig;
        return w.__e2eListStable >= 5;
      },
      undefined,
      { polling: 100, timeout: 4_000 }
    );
    await expect(scrollToBottom).toBeHidden({ timeout: 500 });
  }).toPass({ timeout: 30_000 });
}

/** Scroll the open message list to its top, as a user reaching the oldest loaded message. */
export async function scrollMessageListToTop(page: Page): Promise<void> {
  await page.locator('cometchat-message-list .cometchat-message-list__container').evaluate((el) => {
    el.scrollTop = 0;
  });
}
