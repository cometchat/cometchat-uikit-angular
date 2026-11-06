import path from 'path';
import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  addReactionAs,
  waitForModeration,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Threads: opening and closing, replying, replies loading back from the server, and rich
 * content inside a thread. The REST API can't create thread replies, so replies are sent
 * from the thread's own composer, as a user would. Every assertion waits on UI state.
 */

const IMAGE_FIXTURE = path.resolve(__dirname, '../fixtures/test-image.png');

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  const secondaryName = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  const list = await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  return list;
}

const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const threadPanel = (page: Page) => page.locator('.cometchat-threaded-messages');
const threadList = (page: Page) => threadPanel(page).locator('cometchat-message-list');
const threadEditor = (page: Page) =>
  threadPanel(page).locator('cometchat-message-composer [contenteditable="true"]').first();

/** The main-list row of the most recent message containing `text`. */
const mainRow = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

/**
 * Start (or open) the thread on a message via its "Reply in thread" option. By default waits
 * for the thread's first load: a reply sent before it completes can be sent but not shown
 * (ENG-39944).
 */
async function openThreadFromMenu(page: Page, text: string, { waitForLoad = true } = {}) {
  const row = mainRow(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  const parentId = await row.getAttribute('data-message-id');
  const firstLoad = page.waitForResponse(
    (r) => r.request().method() === 'GET' && r.url().includes(`/messages/${parentId}/thread`),
    { timeout: 30_000 }
  );
  await row.locator('.cometchat-message-bubble__body').first().hover();
  const quick = row.getByRole('button', { name: 'Reply in thread' });
  if (await quick.isVisible()) {
    await quick.click();
  } else {
    await row.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Reply in thread' }).click();
  }
  await expect(threadPanel(page)).toBeVisible();
  await expect(threadPanel(page).locator('cometchat-thread-header')).toContainText(text);
  if (waitForLoad) await firstLoad;
  else firstLoad.catch(() => undefined);
}

async function replyInThread(page: Page, text: string) {
  await threadEditor(page).click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(threadList(page).getByText(text)).toBeVisible({ timeout: 30_000 });
}

/** Re-open the app and the parent's thread so its replies are fetched from the server. */
async function reopenThread(page: Page, parentText: string) {
  await page.reload();
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
  await mainRow(page, parentText).locator('cometchat-thread-view').click();
  await expect(threadPanel(page).locator('cometchat-thread-header')).toContainText(parentText);
  await expect(threadList(page).locator('.cometchat-message-list__message').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Threads', () => {
  test('a reply in a thread stays in the thread, counts on the parent, and closing returns to the chat @smoke', async ({
    page,
  }) => {
    const runId = uniqueTag();
    const parent = `Thread parent ${runId}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openSecondaryChat(page);

    await openThreadFromMenu(page, parent);
    const reply = `Thread reply ${runId}`;
    await replyInThread(page, reply);

    await expect(mainRow(page, parent).locator('cometchat-thread-view')).toContainText('1', { timeout: 15_000 });
    await expect(mainList(page).getByText(reply)).toHaveCount(0);
    // The main composer is not left in reply mode by the thread reply.
    await expect(page.locator('.cometchat-messages__composer cometchat-message-preview')).toHaveCount(0);

    await threadPanel(page).locator('.cometchat-thread-header__close-button').click();
    await expect(threadPanel(page)).toBeHidden();
    await expect(mainRow(page, parent)).toBeVisible();
  });

  test("a thread's replies load back from the server in order, with the right count @smoke", async ({ page }) => {
    const runId = uniqueTag();
    const parent = `Thread with history ${runId}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openSecondaryChat(page);
    await openThreadFromMenu(page, parent);
    const replies = [1, 2, 3].map((n) => `History reply ${n} [${runId}]`);
    for (const reply of replies) await replyInThread(page, reply);
    // The thread shows a reply as soon as it is sent, but the server counts and returns it
    // only once moderation passes it. Reloading before that would load a shorter thread.
    for (const reply of replies) {
      const row = threadList(page).locator('.cometchat-message-list__message').filter({ hasText: reply });
      // A sent reply's row carries its server id once the send completes.
      await expect(row).toHaveAttribute('data-message-id', /^\d+$/, { timeout: 30_000 });
      await waitForModeration((await row.getAttribute('data-message-id'))!);
    }

    await reopenThread(page, parent);

    await expect(mainRow(page, parent).locator('cometchat-thread-view')).toContainText('3');
    const rendered = threadList(page).locator('.cometchat-message-list__message').filter({ hasText: `[${runId}]` });
    await expect(rendered).toHaveCount(3, { timeout: 30_000 });
    await expect(rendered).toHaveText(replies.map((r) => new RegExp(r.replace(/[[\]]/g, '\\$&'))));
  });

  test('a reply sent the moment a thread opens still appears in the thread', async ({ page }) => {
    // Known UI Kit defect (ENG-39944, in threads): a reply sent before the thread's first load
    // completes is sent and counted on the parent, but never appears in the thread list.
    // The thread's first fetch is held until the reply has been accepted by the server, so the
    // race happens every run. Expected to fail until fixed.
    test.fail();
    const runId = uniqueTag();
    const parent = `Thread opened fast ${runId}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openSecondaryChat(page);
    let releaseFirstLoad = () => {};
    const released = new Promise<void>((resolve) => (releaseFirstLoad = resolve));
    await page.route(/\/messages\/\d+\/thread/, async (route) => {
      await released;
      await route.continue();
    });
    await openThreadFromMenu(page, parent, { waitForLoad: false });

    const reply = `Immediate reply ${runId}`;
    const sent = page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/messages(\?|$)/.test(new URL(r.url()).pathname) && r.ok(),
      { timeout: 30_000 }
    );
    await threadEditor(page).click();
    await page.keyboard.type(reply);
    await page.keyboard.press('Enter');
    await sent;
    releaseFirstLoad();

    // The reply was sent: the parent counts it…
    await expect(mainRow(page, parent).locator('cometchat-thread-view')).toContainText('1', { timeout: 15_000 });
    // …and the thread shows it.
    await expect(threadList(page).getByText(reply)).toBeVisible({ timeout: 10_000 });
  });

  test('an image sent in a thread renders as an image bubble in the thread', async ({ page }) => {
    const parent = `Thread for an image ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openSecondaryChat(page);
    await openThreadFromMenu(page, parent);

    await threadPanel(page).getByRole('button', { name: 'Add attachment' }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.locator('.cometchat-action-sheet__item').filter({ hasText: 'Attach Image' }).click();
    await (await chooser).setFiles(IMAGE_FIXTURE);
    const send = threadPanel(page).getByRole('button', { name: /send/i }).last();
    await expect(send).toBeEnabled({ timeout: 30_000 });
    await send.click();

    await expect(threadList(page).locator('cometchat-image-bubble img').last()).toBeVisible({ timeout: 30_000 });
    await expect(mainList(page).locator(`.cometchat-message-list__message`).filter({ hasText: parent }).last()
      .locator('cometchat-thread-view')).toContainText('1', { timeout: 15_000 });
  });

  test('a reaction on a thread reply shows in the thread', async ({ page }) => {
    const runId = uniqueTag();
    const parent = `Thread for a reaction ${runId}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openSecondaryChat(page);
    await openThreadFromMenu(page, parent);
    const reply = `React to me ${runId}`;
    await replyInThread(page, reply);
    // Until the server acknowledges the message, the row carries a temporary local id (cc_…).
    const replyRow = threadList(page).locator('.cometchat-message-list__message').filter({ hasText: reply }).last();
    await expect(replyRow).toHaveAttribute('data-message-id', /^\d+$/, { timeout: 15_000 });
    const replyId = (await replyRow.getAttribute('data-message-id'))!;
    // A message pending moderation is not yet visible to the other user, who can't react to it.
    await waitForModeration(replyId);

    await addReactionAs(SECONDARY_USER, replyId, '👍');
    await reopenThread(page, parent);

    const reloadedRow = threadList(page).locator(`.cometchat-message-list__message[data-message-id="${replyId}"]`);
    await expect(reloadedRow.locator('cometchat-reactions')).toContainText('👍', { timeout: 30_000 });
  });
});
