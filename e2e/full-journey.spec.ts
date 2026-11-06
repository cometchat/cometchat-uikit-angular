import { test, expect, Page, Locator } from './fixtures/coverage';
import {
  loginToApp,
  PRIMARY_USER,
  SECONDARY_USER,
  getUserName,
  openConversation,
  conversationRow,
  scrollToLatestMessage,
  sendTextAs,
  createE2EGroup,
  deleteGroup,
  findGroupByName,
  searchMessagesAs,
  waitForModeration,
} from './helpers';
import path from 'path';

/**
 * Full Journey E2E Test — CometChat Angular UIKit
 *
 * Walks through the sample app's main features in one signed-in session, the way a user
 * would: chats, sending text and media, message actions, threads, the Users, Groups and
 * Calls tabs, a second user receiving a message live, search, new chat, creating groups,
 * calls, details panels and the composer's emoji, sticker and voice tools.
 *
 * All 1:1 steps run in Andrew Joseph's chat with George Alan, and all group steps in a
 * group this file creates, so no step depends on which conversation happens to be first.
 * Each test opens what it needs, so a failure doesn't skip the rest.
 *
 * Run: npx playwright test e2e/full-journey.spec.ts --headed
 */

// Fake camera and microphone, for the voice recording and call steps. File-level: launch
// options can't change inside a describe group.
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

// Unique suffix to identify messages from this test run
const RUN_ID = Date.now().toString(36);

// Every test works in Andrew Joseph's 1:1 chat with George Alan rather than whichever chat
// happens to be first: other specs keep creating groups that jump to the top of the list.
// The names are looked up in beforeAll: an isolated run (E2E_RUN_ID) uses users of its own.
// (Locally they are Andrew Joseph and George Alan, whom the comments below call them.)
let GEORGE = '';
let ANDREW = '';
const GROUP_GUID = `e2e-journey-${RUN_ID}`;
// A message 27.9 finds through search. Sent in beforeAll, as new messages take a while to reach
// the search index, and so that the later steps push it off the latest page. Letters only: the
// server's search splits a keyword that mixes letters and digits into pieces.
const SEARCH_TOKEN = `journeyjump${RUN_ID.replace(/[0-9]/g, (d) => 'qwertyuiop'[Number(d)])}`;
let searchTargetId = '';
const GROUP_NAME = `E2E Journey ${RUN_ID}`;

const fixture = (name: string) => path.resolve(__dirname, 'fixtures', name);

const tab = (page: Page, name: string) => page.getByLabel('Navigation tabs').getByRole('tab', { name });
const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const composer = (page: Page) => page.locator('cometchat-messages cometchat-message-composer').first();
const editor = (page: Page) => composer(page).locator('[contenteditable="true"]').first();
const header = (page: Page) => page.locator('cometchat-message-header').first();
const threadPanel = (page: Page) => page.locator('.cometchat-threaded-messages');

/** The main-list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

/** The newest row in the main list. */
const lastRow = (page: Page) => mainList(page).locator('.cometchat-message-list__message').last();

/**
 * Open `name` from the Chats tab, at its latest message. Pass `fresh` when the test sent its
 * own message over REST first: reloading makes the chat fetch it rather than rely on live
 * delivery to an already-open chat (covered by the realtime spec).
 */
async function openChat(page: Page, name: string, { fresh = false } = {}) {
  if (fresh) await page.reload();
  // Close anything an earlier step left open (a picker, a menu, a panel).
  await page.keyboard.press('Escape');
  await tab(page, 'Chats').click();
  await openConversation(page, name);
  await waitForFirstLoad(page);
  await scrollToLatestMessage(page).catch(() => undefined); // a new chat may have nothing to scroll
}

/**
 * Wait for the open chat's first load to finish: a message sent while the chat is still
 * loading can vanish from view (known UI Kit defect), which would fail the test for the wrong
 * reason.
 */
async function waitForFirstLoad(page: Page) {
  const list = mainList(page);
  await expect(list.locator('.cometchat-message-list__loading, .cometchat-message-list__shimmer')).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(list.locator('.cometchat-message-list__message').first()).toBeVisible({ timeout: 30_000 });
}

/**
 * Wait for the main-list row containing `text`. While the list is scrolled up it doesn't render
 * new messages, so keep bringing it back to the latest message.
 */
async function expectRow(page: Page, text: string): Promise<Locator> {
  const row = rowWithText(page, text);
  await expect(async () => {
    await scrollToLatestMessage(page).catch(() => undefined);
    await expect(row).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  return row;
}

/**
 * Wait until the server has accepted the message in `row`. Until it answers, the row carries a
 * temporary "cc_…" id, and a failed send keeps it: the list now shows failed sends, so a visible
 * bubble alone doesn't mean the send worked.
 */
async function expectAccepted(row: Locator) {
  await expect(row).not.toHaveAttribute('data-message-id', /^cc_/, { timeout: 30_000 });
}

/** Type `text` in the main composer, send it, and wait until the server has accepted it. */
async function sendFromComposer(page: Page, text: string): Promise<Locator> {
  await editor(page).click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  const row = await expectRow(page, text);
  await expectAccepted(row);
  return row;
}

/** An item of an open "More options" menu (every row also renders its quick actions as menuitems). */
const subMenuItem = (page: Page, name: string) =>
  page.locator(`.cometchat-menu-list__sub-menu-list-item[aria-label="${name}"]`).filter({ visible: true }).first();

/** Hover a message and open its "More options" menu. */
async function openMessageMenu(page: Page, row: Locator) {
  await expect(async () => {
    await row.locator('.cometchat-message-bubble__body').first().hover();
    await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
    await expect(page.locator('.cometchat-menu-list__sub-menu-list-item').filter({ visible: true }).first()).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({ timeout: 20_000 });
}

/** Run a message option: a quick action on the bubble if shown, else from "More options". */
async function messageOption(page: Page, row: Locator, name: string) {
  await row.locator('.cometchat-message-bubble__body').first().hover();
  const quick = row.locator('.cometchat-message-bubble__options').getByRole('menuitem', { name, exact: true });
  if (await quick.isVisible()) {
    await quick.click();
    return;
  }
  await openMessageMenu(page, row);
  await subMenuItem(page, name).click();
}

/**
 * Open the thread on `row` and wait for its first load: a reply sent before that load
 * completes can be sent but never shown (known UI Kit defect).
 */
async function openThread(page: Page, row: Locator, parentText: string) {
  const parentId = await row.getAttribute('data-message-id');
  const firstLoad = page.waitForResponse(
    (r) => r.request().method() === 'GET' && r.url().includes(`/messages/${parentId}/thread`),
    { timeout: 30_000 }
  );
  await messageOption(page, row, 'Reply in thread');
  await expect(threadPanel(page).locator('cometchat-thread-header')).toContainText(parentText);
  await firstLoad;
}

/** Send `text` from the open thread's composer and wait for it in the thread. */
async function replyInThread(page: Page, text: string): Promise<Locator> {
  await threadPanel(page).locator('cometchat-message-composer [contenteditable="true"]').first().click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  const reply = threadPanel(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();
  await expect(reply).toBeVisible({ timeout: 30_000 });
  return reply;
}

/** Open the composer's attachment menu and pick `item`. */
async function attachmentOption(page: Page, item: string) {
  await composer(page).getByRole('button', { name: 'Add attachment' }).click();
  const option = page.locator('.cometchat-action-sheet__item').filter({ hasText: item }).first();
  await expect(option).toBeVisible();
  return option;
}

/** Pick a file through an attachment menu item, then send the staged upload. */
async function sendAttachment(page: Page, item: string, file: string) {
  const option = await attachmentOption(page, item);
  const chooser = page.waitForEvent('filechooser');
  await option.click();
  await (await chooser).setFiles(file);
  await expect(page.locator('.cometchat-attachment-tile')).toHaveCount(1, { timeout: 30_000 });
  const send = page.locator('.cometchat-message-composer__send-button-inner:visible .cometchat-button').first();
  await expect(send).toBeEnabled({ timeout: 45_000 });
  await send.click();
  await expect(page.locator('.cometchat-attachment-tile')).toHaveCount(0, { timeout: 30_000 });
}

test.describe('Full App Journey', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    [ANDREW, GEORGE] = await Promise.all([getUserName(PRIMARY_USER), getUserName(SECONDARY_USER)]);
    // A group of our own for the group steps, with George as a member.
    await createE2EGroup(GROUP_GUID, GROUP_NAME, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    searchTargetId = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Jump target ${SEARCH_TOKEN}`);
    // Put George's chat at the top of Andrew's list so its row is on the first page.
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Full journey start ${RUN_ID}`);
    const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
    page = await context.newPage();
    await loginToApp(page, { userUid: PRIMARY_USER });
  });

  test.afterAll(async () => {
    await page.context().close();
    await deleteGroup(GROUP_GUID).catch(() => undefined);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: CONVERSATIONS TAB
  // ═══════════════════════════════════════════════════════════════

  test('1.1 — Conversations list loads with items', async () => {
    await tab(page, 'Chats').click();
    await expect(conversationRow(page, GEORGE)).toBeVisible({ timeout: 30_000 });
    await expect(conversationRow(page, GEORGE)).toContainText(`Full journey start ${RUN_ID}`);
  });

  test('1.2 — Open a 1:1 conversation', async () => {
    await openChat(page, GEORGE);
    await expect(header(page)).toContainText(GEORGE);
    await expect(rowWithText(page, `Full journey start ${RUN_ID}`)).toBeVisible();
    await expect(editor(page)).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: SEND MESSAGES
  // ═══════════════════════════════════════════════════════════════

  test('2.1 — Send a text message and verify it appears', async () => {
    await openChat(page, GEORGE);
    const row = await sendFromComposer(page, `Hello from full-journey test [${RUN_ID}]`);
    await expect(row.locator('.cometchat-message-bubble__wrapper--outgoing, .cometchat-message-bubble-outgoing').first()).toBeVisible();
  });

  test('2.2 — Send an image attachment', async () => {
    await openChat(page, GEORGE);
    await sendAttachment(page, 'Attach Image', fixture('test-image.png'));
    await expect(lastRow(page).locator('cometchat-image-bubble, cometchat-images-bubble').first()).toBeVisible({
      timeout: 30_000,
    });
    await expectAccepted(lastRow(page));
  });

  test('2.3 — Send a file attachment', async () => {
    await openChat(page, GEORGE);
    await sendAttachment(page, 'Attach File', fixture('test-file.pdf'));
    const bubble = lastRow(page).locator('cometchat-file-bubble, cometchat-files-bubble').first();
    await expect(bubble).toBeVisible({ timeout: 30_000 });
    await expect(bubble).toContainText('test-file');
    await expectAccepted(lastRow(page));
  });

  test('2.4 — Create a Poll from attachment options @quarantine (ENG-40810)', async () => {
    // @quarantine (ENG-40810): intermittent UI Kit defect — a message that reaches an open chat in real time
    // (here the extension posts it as Andrew) is sometimes never rendered, though the Chats row
    // previews it; it shows after the chat is reopened. Not every run, so it can't be test.fail.
    await openChat(page, GEORGE);
    await (await attachmentOption(page, 'Polls')).click();
    const form = page.locator('cometchat-create-poll');
    await expect(form).toBeVisible();
    const question = `E2E Poll Question [${RUN_ID}]`;
    await form.getByPlaceholder('Ask question').fill(question);
    await form.getByRole('textbox', { name: 'Options 1', exact: true }).fill('Option A');
    await form.getByRole('textbox', { name: 'Options 2', exact: true }).fill('Option B');
    await form.getByRole('button', { name: 'Create' }).click();
    await expect(form.getByText('Something went wrong. Please try again.'), 'Is the Polls extension enabled?').toBeHidden();
    await expect(form).toBeHidden({ timeout: 15_000 });

    const poll = (await expectRow(page, question)).locator('cometchat-poll-bubble');
    await expect(poll).toBeVisible({ timeout: 30_000 });
    await expect(poll.getByRole('radio', { name: /Option A/ })).toBeVisible();
    await expect(poll.getByRole('radio', { name: /Option B/ })).toBeVisible();
  });

  test('2.5 — Open Collaborative Whiteboard from attachment options @quarantine (ENG-40810)', async () => {
    // @quarantine (ENG-40810): intermittent UI Kit defect — a message that reaches an open chat in real time
    // (here the extension posts it as Andrew) is sometimes never rendered, though the Chats row
    // previews it; it shows after the chat is reopened. Not every run, so it can't be test.fail.
    await openChat(page, GEORGE);
    const before = await mainList(page).getByText('Collaborative Whiteboard').count();
    await (await attachmentOption(page, 'Collaborative Whiteboard')).click();
    await expect(mainList(page).getByText('Collaborative Whiteboard')).toHaveCount(before + 1, { timeout: 30_000 });
    await expect(lastRow(page)).toContainText('Open Whiteboard');
  });

  test('2.6 — Open Collaborative Document from attachment options @quarantine (ENG-40810)', async () => {
    // @quarantine (ENG-40810): intermittent UI Kit defect — a message that reaches an open chat in real time
    // (here the extension posts it as Andrew) is sometimes never rendered, though the Chats row
    // previews it; it shows after the chat is reopened. Not every run, so it can't be test.fail.
    await openChat(page, GEORGE);
    const before = await mainList(page).getByText('Collaborative Document').count();
    await (await attachmentOption(page, 'Collaborative Document')).click();
    await expect(mainList(page).getByText('Collaborative Document')).toHaveCount(before + 1, { timeout: 30_000 });
    await expect(lastRow(page)).toContainText('Open Document');
  });

  test('2.7 — Send a video attachment', async () => {
    await openChat(page, GEORGE);
    await sendAttachment(page, 'Attach Video', fixture('test-video.mp4'));
    await expect(lastRow(page).locator('cometchat-video-bubble, cometchat-videos-bubble').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('2.8 — Send an audio attachment', async () => {
    await openChat(page, GEORGE);
    await sendAttachment(page, 'Attach Audio', fixture('test-audio.wav'));
    await expect(lastRow(page).locator('cometchat-audio-bubble, cometchat-audios-bubble').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: MESSAGE ACTIONS (React, Edit, Delete)
  // ═══════════════════════════════════════════════════════════════

  test('3.1 — React to a message @smoke', async () => {
    const text = `React to me [${RUN_ID}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, text);

    await messageOption(page, row, 'React');
    const firstEmoji = page.locator('.cometchat-emoji-keyboard__list-item').first();
    await expect(firstEmoji).toBeVisible();
    const emoji = (await firstEmoji.textContent())!.trim();
    await firstEmoji.click();

    await expect(row.locator('cometchat-reactions')).toContainText(emoji, { timeout: 30_000 });
  });

  test('3.2 — Edit a message', async () => {
    await openChat(page, GEORGE);
    const original = `Edit me [${RUN_ID}]`;
    const row = await sendFromComposer(page, original);
    // The E2E app moderates messages, and the server refuses to edit one still under review
    // (403 ERR_MESSAGE_NO_ACCESS).
    await waitForModeration((await row.getAttribute('data-message-id'))!);

    await openMessageMenu(page, row);
    await subMenuItem(page, 'Edit').click();
    await expect(composer(page)).toContainText('Editing message');
    await expect(editor(page)).toContainText(original);

    await editor(page).press('ControlOrMeta+a');
    const edited = `Edited message [${RUN_ID}]`;
    await page.keyboard.type(edited);
    await page.keyboard.press('Enter');

    const editedRow = rowWithText(page, edited);
    await expect(editedRow).toBeVisible({ timeout: 30_000 });
    await expect(editedRow).toContainText('Edited');
    await expect(mainList(page).getByText(original, { exact: true })).toHaveCount(0);
  });

  test('3.3 — Delete a message', async () => {
    await openChat(page, GEORGE);
    const text = `Delete me [${RUN_ID}]`;
    const row = await sendFromComposer(page, text);
    const id = await row.getAttribute('data-message-id');
    // As with edit, the server refuses to delete a message still under moderation review.
    await waitForModeration(id!);

    await openMessageMenu(page, row);
    await subMenuItem(page, 'Delete').click();
    const confirm = page.locator('cometchat-confirm-dialog, .cometchat-confirm-dialog').first();
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    const deletedRow = mainList(page).locator(`.cometchat-message-list__message[data-message-id="${id}"]`);
    await expect(deletedRow).toContainText('This message was deleted', { timeout: 30_000 });
    await expect(mainList(page).getByText(text)).toHaveCount(0);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: THREAD REPLIES
  // ═══════════════════════════════════════════════════════════════

  test('4.1 — Open thread and reply', async () => {
    const parent = `Thread parent [${RUN_ID}]`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, parent);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, parent);

    await openThread(page, row, parent);
    const reply = `Thread reply [${RUN_ID}]`;
    await replyInThread(page, reply);
    // The reply stays out of the main list and is counted on the parent.
    await expect(mainList(page).getByText(reply)).toHaveCount(0);
    await expect(row.locator('cometchat-thread-view')).toContainText('1', { timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: USERS TAB
  // ═══════════════════════════════════════════════════════════════

  test('5.1 — Switch to Users tab and browse users', async () => {
    await tab(page, 'Users').click();
    const users = page.locator('cometchat-users');
    await expect(users.getByRole('listbox', { name: 'Users list' })).toBeVisible();
    await expect(users.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
    expect(await users.locator('cometchat-user-item').count()).toBeGreaterThan(1);
  });

  test('5.2 — Click a user to open chat', async () => {
    await tab(page, 'Users').click();
    const users = page.locator('cometchat-users');
    const george = users.locator('cometchat-user-item').filter({ hasText: GEORGE });
    // Search typed before the list first renders is ignored, so wait for it, and retry.
    await expect(users.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await users.getByRole('searchbox').fill(GEORGE);
      await expect(george).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await george.click();

    await expect(header(page)).toContainText(GEORGE, { timeout: 15_000 });
    await expect(mainList(page)).toBeVisible();
  });

  test('5.3 — Send a message to a user from Users tab', async () => {
    // Continues in the chat opened from the Users tab.
    await expect(header(page)).toContainText(GEORGE);
    await scrollToLatestMessage(page).catch(() => undefined);
    await sendFromComposer(page, `User tab message [${RUN_ID}]`);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: GROUPS TAB
  // ═══════════════════════════════════════════════════════════════

  test('6.1 — Switch to Groups tab and browse groups', async () => {
    await tab(page, 'Groups').click();
    const groups = page.locator('cometchat-groups');
    await expect(groups.getByRole('listbox', { name: 'Groups list' })).toBeVisible();
    await expect(groups.locator('cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
    await groups.getByRole('searchbox').fill(GROUP_NAME);
    await expect(groups.locator('cometchat-group-item').filter({ hasText: GROUP_NAME })).toBeVisible({ timeout: 15_000 });
  });

  test('6.2 — Open a group conversation and send a message', async () => {
    await tab(page, 'Groups').click();
    const groups = page.locator('cometchat-groups');
    const row = groups.locator('cometchat-group-item').filter({ hasText: GROUP_NAME });
    await expect(groups.locator('cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await groups.getByRole('searchbox').fill(GROUP_NAME);
      await expect(row).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await row.click();

    await expect(header(page)).toContainText(GROUP_NAME, { timeout: 15_000 });
    await waitForFirstLoad(page);
    await sendFromComposer(page, `Group message [${RUN_ID}]`);
  });

  test('6.3 — Open group details and view members', async () => {
    await openChat(page, GROUP_NAME);
    await header(page).locator('.cometchat-message-header__info').first().click();
    const details = page.locator('cometchat-group-details');
    await expect(details).toBeVisible();
    await expect(details.locator('cometchat-group-member-item').filter({ hasText: ANDREW })).toBeVisible({ timeout: 15_000 });
    await expect(details.locator('cometchat-group-member-item').filter({ hasText: GEORGE })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: CALLS TAB
  // ═══════════════════════════════════════════════════════════════

  test('7.1 — Switch to Calls tab and verify it renders', async () => {
    await tab(page, 'Calls').click();
    const callLogs = page.locator('cometchat-call-logs');
    await expect(callLogs).toBeVisible({ timeout: 15_000 });
    // Earlier specs and this file's own calls leave history, but a fresh app shows its empty state.
    await expect(
      callLogs.locator('cometchat-call-log-item, .cometchat-list-item').first().or(callLogs.getByText(/No Call Logs/i))
    ).toBeVisible({ timeout: 30_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: BACK TO CHATS — MESSAGE HEADER
  // ═══════════════════════════════════════════════════════════════

  test('8.1 — Switch back to Chats and verify message header', async () => {
    await openChat(page, GEORGE);
    await expect(header(page)).toContainText(GEORGE);
    await expect(header(page).getByRole('button', { name: 'Voice call' })).toBeVisible();
    await expect(header(page).getByRole('button', { name: 'Video call' })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: REAL-TIME — Second user receives message
  // ═══════════════════════════════════════════════════════════════

  test('9.1 — User B receives real-time message from User A @realtime', async ({ browser }) => {
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    try {
      // George signs in and opens the chat first, so the message must arrive live.
      await loginToApp(pageB, { userUid: SECONDARY_USER });
      await openConversation(pageB, ANDREW);

      await openChat(page, GEORGE);
      const realtimeMsg = `Realtime check [${RUN_ID}]`;
      await sendFromComposer(page, realtimeMsg);

      await expect(pageB.locator('cometchat-message-list').getByText(realtimeMsg)).toBeVisible({ timeout: 30_000 });
    } finally {
      await contextB.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: SEARCH
  // ═══════════════════════════════════════════════════════════════

  test('10.1 — Search for a conversation or message', async () => {
    await tab(page, 'Chats').click();
    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    await expect(search).toBeVisible();
    const results = search.locator('.cometchat-search__results');

    await expect(async () => {
      await search.getByRole('searchbox').fill('');
      await search.getByRole('searchbox').fill(GEORGE);
      await expect(results).toContainText('Conversations', { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(results).toContainText(GEORGE);
    await search.getByRole('button', { name: 'Back' }).click();
    await expect(search).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: TRANSLATE MESSAGE
  // ═══════════════════════════════════════════════════════════════

  test('11.1 — Translate a message via context menu', async () => {
    const text = `Bonjour, comment allez-vous aujourd'hui? [${RUN_ID}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, text);

    await openMessageMenu(page, row);
    await subMenuItem(page, 'Translate').click();

    await expect(row).toContainText('Translated message', { timeout: 30_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: COPY MESSAGE
  // ═══════════════════════════════════════════════════════════════

  test('12.1 — Copy a message via context menu', async () => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await openChat(page, GEORGE);
    const text = `Copy me [${RUN_ID}]`;
    const row = await sendFromComposer(page, text);

    await openMessageMenu(page, row);
    await subMenuItem(page, 'Copy').click();

    await expect(page.getByText('Message copied to clipboard.')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: MESSAGE INFO
  // ═══════════════════════════════════════════════════════════════

  test('13.1 — View message info via context menu', async () => {
    await openChat(page, GEORGE);
    const text = `Info for me [${RUN_ID}]`;
    const row = await sendFromComposer(page, text);

    await openMessageMenu(page, row);
    await subMenuItem(page, 'Info').click();

    const info = page.getByRole('dialog', { name: 'Message Information' });
    await expect(info).toBeVisible();
    await expect(info).toContainText(text);
    await info.getByRole('button', { name: /Close/ }).click();
    await expect(info).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 14: THREAD CHAT (Reply in Thread + Send in Thread)
  // ═══════════════════════════════════════════════════════════════

  test('14.1 — Open thread, send a reply, and verify thread panel', async () => {
    const parent = `Thread from George [${RUN_ID}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, parent);

    await openThread(page, row, parent);
    await replyInThread(page, `Thread reply extended [${RUN_ID}]`);

    await threadPanel(page).locator('.cometchat-thread-header__close-button').click();
    await expect(threadPanel(page)).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 15: MENTIONS IN COMPOSER
  // ═══════════════════════════════════════════════════════════════

  test('15.1 — Type @ in composer, select mention, send and verify @smoke', async () => {
    await openChat(page, GROUP_NAME);
    await editor(page).click();
    const suggestion = composer(page).getByRole('option', { name: new RegExp(GEORGE) }).first();
    // The suggestion list refreshes while typing, so retry from a clean composer.
    await expect(async () => {
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(`@${GEORGE.slice(0, 3)}`);
      await expect(suggestion).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await suggestion.click();

    const tail = `mention test [${RUN_ID}]`;
    await page.keyboard.type(` ${tail}`);
    await page.keyboard.press('Enter');

    const row = rowWithText(page, tail);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText(`@${GEORGE}`);
    await expect(row).not.toContainText('<@uid:');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 16: NEW CHAT (from Conversations menu)
  // ═══════════════════════════════════════════════════════════════

  test('16.1 — Open New Chat from conversations menu', async () => {
    await tab(page, 'Chats').click();
    const openNewChat = async () => {
      await page.getByRole('button', { name: 'CometChat Selector' }).click();
      await page.getByRole('menuitem', { name: 'Create conversation' }).click();
      const newChat = page.getByRole('region', { name: 'New Chat' });
      await expect(newChat).toBeVisible();
      return newChat;
    };

    // Users tab: pick George and land in his chat.
    let newChat = await openNewChat();
    await newChat.getByRole('tab', { name: 'Users' }).click();
    const george = newChat.locator('cometchat-user-item').filter({ hasText: GEORGE });
    await expect(newChat.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await newChat.getByRole('searchbox').fill(GEORGE);
      await expect(george).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await george.click();
    await expect(newChat).toBeHidden();
    await expect(header(page)).toContainText(GEORGE);

    // Groups tab: lists groups, and Back closes the panel.
    newChat = await openNewChat();
    await newChat.getByRole('tab', { name: 'Groups' }).click();
    await expect(newChat.locator('cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
    await newChat.getByRole('button', { name: 'Back' }).click();
    await expect(newChat).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 17: CREATE GROUP
  // ═══════════════════════════════════════════════════════════════

  test('17.1 — Open Create Group and test all group types', async () => {
    const created: string[] = [];
    try {
      for (const type of ['Public', 'Private', 'Password'] as const) {
        await tab(page, 'Groups').click();
        await page.getByRole('button', { name: 'New Group' }).click();
        const dialog = page.getByRole('dialog', { name: 'New Group' });
        await expect(dialog).toBeVisible();

        const create = dialog.getByRole('button', { name: 'Create Group' });
        await expect(dialog.getByRole('radio', { name: 'Public' })).toBeChecked();
        await expect(create).toBeDisabled();

        const radio = dialog.getByRole('radio', { name: type });
        await radio.click({ force: true });
        await expect(radio).toBeChecked();
        const name = `E2E_${type}_${RUN_ID}`;
        await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
        if (type === 'Password') {
          await expect(create).toBeDisabled(); // a password group needs its password
          await dialog.locator('input[type="password"]').fill('test123');
        }
        await expect(create).toBeEnabled();
        await create.click();

        await expect(dialog).toBeHidden({ timeout: 15_000 });
        await expect(header(page)).toContainText(name, { timeout: 15_000 });
        created.push(name);
      }
    } finally {
      // Groups created through the UI carry no teardown tag, so delete them by name.
      for (const name of created) {
        const group = await findGroupByName(name).catch(() => null);
        if (group) await deleteGroup(group.guid);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 18: VOICE & VIDEO CALL BUTTONS
  // ═══════════════════════════════════════════════════════════════

  test('18.1 — Voice call button is present in message header', async () => {
    await openChat(page, GEORGE);
    await expect(header(page).locator('cometchat-call-buttons').getByRole('button', { name: 'Voice call' })).toBeEnabled();
  });

  test('18.2 — Video call button is present in message header', async () => {
    await openChat(page, GEORGE);
    await expect(header(page).locator('cometchat-call-buttons').getByRole('button', { name: 'Video call' })).toBeEnabled();
  });

  /** Start a call to George, check the outgoing call screen, then cancel it. */
  async function callGeorgeAndCancel(kind: 'Voice call' | 'Video call') {
    await openChat(page, GEORGE);
    const outgoing = page.locator('cometchat-outgoing-call');
    await header(page).locator('cometchat-call-buttons').getByRole('button', { name: kind }).click();
    try {
      // If another session of Andrew is open somewhere, the call can be rejected as busy at once
      // (known incoming-call defect), and this screen never shows.
      await expect(outgoing).toContainText(GEORGE, { timeout: 15_000 });
      await expect(outgoing).toContainText('Calling...');
    } finally {
      // Never leave George's devices ringing.
      if (await outgoing.isVisible()) await outgoing.getByRole('button').first().click();
    }
    await expect(outgoing).toBeHidden({ timeout: 15_000 });
  }

  test('18.3 — Clicking voice call initiates a call', async () => {
    await callGeorgeAndCancel('Voice call');
  });

  test('18.4 — Clicking video call initiates a call', async () => {
    await callGeorgeAndCancel('Video call');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 19: USER DETAILS PANEL
  // ═══════════════════════════════════════════════════════════════

  test('19.1 — Open user details from message header', async () => {
    await openChat(page, GEORGE);
    await header(page).locator('.cometchat-message-header__info').first().click();
    const details = page.locator('cometchat-user-details');
    await expect(details).toBeVisible();
    await expect(details).toContainText(GEORGE);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 20: EMOJI & STICKER BUTTONS IN COMPOSER
  // ═══════════════════════════════════════════════════════════════

  test('20.1 — Emoji button opens picker, select emoji, send it', async () => {
    await openChat(page, GEORGE);
    await editor(page).click();
    const tag = `Emoji [${RUN_ID}] `;
    await page.keyboard.type(tag);
    await composer(page).getByRole('button', { name: 'Emoji' }).click();
    const firstEmoji = page.locator('.cometchat-emoji-keyboard__list-item').first();
    await expect(firstEmoji).toBeVisible();
    const emoji = (await firstEmoji.textContent())!.trim();
    await firstEmoji.click();
    await expect(editor(page)).toContainText(emoji);

    await editor(page).click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(rowWithText(page, tag.trim())).toContainText(emoji, { timeout: 30_000 });
  });

  test('20.2 — Sticker button opens panel, click a sticker to send it @quarantine (ENG-40832)', async () => {
    // @quarantine (ENG-40832): the E2E app has no sticker sets (stickers-<region>.cometchat.io/v1/fetch
    // returns empty defaultStickers and customStickers), so there is no sticker to send.
    await openChat(page, GEORGE);
    const stickersBefore = await mainList(page).locator('cometchat-sticker-bubble, [class*="sticker-bubble"]').count();
    await composer(page).getByRole('button', { name: 'Sticker' }).click();
    const keyboard = page.locator('cometchat-stickers-keyboard');
    await expect(keyboard).toBeVisible();
    const sticker = keyboard.getByRole('gridcell').first();
    const empty = keyboard.getByText('No Stickers Available');
    await expect(sticker.or(empty)).toBeVisible({ timeout: 30_000 });
    await expect(empty, 'Set up the Stickers extension for the app in the dashboard').toHaveCount(0);
    await sticker.click();

    await expect(mainList(page).locator('cometchat-sticker-bubble, [class*="sticker-bubble"]')).toHaveCount(
      stickersBefore + 1,
      { timeout: 30_000 }
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 21: VOICE RECORDING IN COMPOSER
  // ═══════════════════════════════════════════════════════════════

  test('21.1 — Voice recording button is present and clickable', async () => {
    await openChat(page, GEORGE);
    await composer(page).getByRole('button', { name: 'Voice recording' }).click();
    const recorder = page.getByLabel('Voice recorder');
    await expect(recorder).toBeVisible();
    await recorder.getByRole('button', { name: 'Delete recording' }).click();
    await expect(recorder).toBeHidden();
    await expect(editor(page)).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 22: GROUP CALLING
  // ═══════════════════════════════════════════════════════════════

  test('22.1 — Group call buttons are present in group chat header', async () => {
    await openChat(page, GROUP_NAME);
    const buttons = header(page).locator('cometchat-call-buttons');
    await expect(buttons.getByRole('button', { name: 'Voice call' })).toBeEnabled();
    await expect(buttons.getByRole('button', { name: 'Video call' })).toBeEnabled();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 23: REPLY TO MESSAGE (Quoted Reply)
  // ═══════════════════════════════════════════════════════════════

  test('23.1 — Reply to a message shows reply preview in composer', async () => {
    const text = `Reply preview target [${RUN_ID}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, text);

    await messageOption(page, row, 'Reply');
    const preview = composer(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview').first();
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(text);

    await preview.getByRole('button').first().click();
    await expect(preview).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 24: AI ASSISTANT
  // ═══════════════════════════════════════════════════════════════

  test('24.1 — AI assistant button or feature is accessible', async () => {
    // The sample app's AI feature: an agent user's chat opens as an AI assistant chat.
    // The sample app reaches an agent only from its conversation in Chats (its user lists show
    // role "default" only), so give Andrew one over REST, then reload to list it.
    const agentUid = process.env['E2E_AGENT_UID'] ?? '';
    expect(agentUid, 'Set E2E_AGENT_UID in .env to the agent user\'s UID').not.toBe('');
    const agentName = await getUserName(agentUid);
    await sendTextAs(PRIMARY_USER, agentUid, `Hello agent [${RUN_ID}]`);
    await page.reload();
    await tab(page, 'Chats').click();
    const row = conversationRow(page, agentName);
    await expect(row).toBeVisible({ timeout: 30_000 });
    const agentChat = page.locator('cometchat-ai-assistant-chat');
    await expect(async () => {
      await row.click();
      await expect(agentChat).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await expect(agentChat.locator('[contenteditable="true"]').first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 25: CONVERSATION LIST CONTEXT MENU (Delete, Mark as Read)
  // ═══════════════════════════════════════════════════════════════

  test('25.1 — Conversation item shows context menu on hover', async () => {
    await tab(page, 'Chats').click();
    const row = conversationRow(page, GEORGE);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await row.hover();
      await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await page.getByRole('heading', { name: 'Chats' }).click();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 26: FULL-SCREEN IMAGE VIEWER
  // ═══════════════════════════════════════════════════════════════

  test('26.1 — Clicking an image opens full-screen viewer', async () => {
    await openChat(page, GEORGE);
    await sendAttachment(page, 'Attach Image', fixture('test-image-2.png'));
    const image = lastRow(page).locator('.cometchat-image-bubble__image-wrapper, cometchat-image-bubble img').first();
    await expect(image).toBeVisible({ timeout: 30_000 });
    await image.click();

    const viewer = page.locator('.cometchat-fullscreen-viewer');
    await expect(viewer).toBeVisible();
    await viewer.locator('.cometchat-fullscreen-viewer__close-btn').click();
    await expect(viewer).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 27: BUG FIX REGRESSIONS
  // Tests that verify the 9 QA-reported bugs are fixed.
  // ═══════════════════════════════════════════════════════════════

  // ──  Emoji reaction toggle (add → remove on second click) ──────

  test('27.1 —  Reacting with same emoji twice toggles it off', async () => {
    // Known UI Kit defect (ENG-40815), expected to fail until fixed. What fails, as seen locally on
    // 6 Nov: the pill of the reaction just added from the picker is found with aria-pressed="true",
    // then is gone before it can be clicked, so the click below never happens. It is not "a click
    // doesn't remove it": 28.1 (full-journey-extended.spec.ts) removes its own reaction by clicking
    // the pill, with another person's reaction on the message.
    test.fail();
    await openChat(page, GEORGE);
    const row = await sendFromComposer(page, `Reaction toggle test [${RUN_ID}]`);

    await messageOption(page, row, 'React');
    const firstEmoji = page.locator('.cometchat-emoji-keyboard__list-item').first();
    await expect(firstEmoji).toBeVisible();
    const emoji = (await firstEmoji.textContent())!.trim();
    await firstEmoji.click();
    const reactions = row.locator('cometchat-reactions');
    await expect(reactions).toContainText(emoji, { timeout: 30_000 });

    // Clicking my own reaction chip removes it.
    const pill = reactions.locator('.cometchat-reactions__reaction').filter({ hasText: emoji });
    await expect(pill).toHaveAttribute('aria-pressed', 'true');
    await pill.click();
    await expect(reactions).not.toContainText(emoji, { timeout: 30_000 });
  });

  // ──  No "Something went wrong" when clicking during load ────────

  test('27.2 —  Clicking conversation during load does not show error', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Click as soon as the row exists, while the app may still be loading.
    const row = conversationRow(page, GEORGE);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();

    // The first click can be dropped while the app starts; openConversation retries it.
    await openConversation(page, GEORGE);
    await expect(page.getByText(/Something went wrong|Looks like something went wrong/)).toHaveCount(0);
    await expect(mainList(page).locator('.cometchat-message-list__message').first()).toBeVisible({ timeout: 30_000 });
  });

  test('27.3 —  Info panel does not close when messages finish loading', async () => {
    await tab(page, 'Chats').click();
    // Open the chat and the details panel at once, before the messages finish loading.
    const firstLoad = page.waitForResponse((r) => r.request().method() === 'GET' && /\/users\/[^/]+\/messages/.test(r.url()), {
      timeout: 30_000,
    });
    await openConversation(page, GEORGE);
    await header(page).locator('.cometchat-message-header__info').first().click();
    const details = page.locator('cometchat-user-details');
    await expect(details).toBeVisible();
    await firstLoad.catch(() => undefined);
    await expect(mainList(page).locator('.cometchat-message-list__message').first()).toBeVisible({ timeout: 30_000 });

    await expect(details).toBeVisible();
  });

  //  Thread reply preview not leaking into main message list ────

  test('27.4  Replying in thread does not show reply preview in main composer', async () => {
    const parent = `Leak parent [${RUN_ID}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await openChat(page, GEORGE, { fresh: true });
    const row = await expectRow(page, parent);
    await openThread(page, row, parent);
    const reply = `Leak reply [${RUN_ID}]`;
    const threadRow = await replyInThread(page, reply);

    // Quote-reply to the message inside the thread.
    await threadRow.locator('.cometchat-message-bubble__body').first().hover();
    await messageOption(page, threadRow, 'Reply');

    const threadPreview = threadPanel(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview').first();
    await expect(threadPreview).toContainText(reply);
    await expect(composer(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview')).toHaveCount(0);
  });

  // ──  Search filter not leaking between global and scoped search ─

  test('27.5 —  Scoped search starts with clean filters (no leak from global search)', async () => {
    await openChat(page, GEORGE);
    // Global search: turn on the Groups filter.
    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    await expect(search).toBeVisible();
    const groupsChip = search.getByRole('button', { name: 'Groups', exact: true });
    await groupsChip.click();
    await expect(groupsChip).toHaveAttribute('aria-pressed', 'true');
    await search.getByRole('button', { name: 'Back' }).click();
    await expect(search).toBeHidden();

    // Search inside the chat from the header.
    await header(page).getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Search' }).filter({ visible: true }).click();
    const scoped = page.locator('cometchat-search').last();
    await expect(scoped).toBeVisible();
    await expect(scoped.locator('[aria-pressed="true"]')).toHaveCount(0);
    await scoped.getByRole('button', { name: 'Back' }).click();
  });

  // ──  Attachment menu fully visible within message area ──────────

  test('27.6 —  Attachment menu does not overflow into conversation list', async () => {
    // Known UI Kit defect (ENG-40823): the attachment menu opens up and to the left of the + button and
    // covers the right edge of the conversation list (about 75px at 1280 wide), even once its
    // opening animation has finished.
    test.fail();
    await openChat(page, GEORGE);
    const listBox = await page.locator('cometchat-conversations').first().boundingBox();
    await composer(page).getByRole('button', { name: 'Add attachment' }).click();
    const sheet = page.locator('.cometchat-action-sheet').first();
    await expect(sheet).toBeVisible();
    expect(listBox).not.toBeNull();
    // Poll: the menu animates in, so its first position isn't where it settles.
    await expect
      .poll(async () => (await sheet.boundingBox())?.x ?? -1, { timeout: 5_000 })
      .toBeGreaterThanOrEqual(listBox!.x + listBox!.width - 10);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  // ── Quoted message renders correctly in message bubble ─────────

  test('27.7 — Quoted message preview renders in reply bubble', async () => {
    await openChat(page, GEORGE);
    const original = `Quote me [${RUN_ID}]`;
    const row = await sendFromComposer(page, original);

    await messageOption(page, row, 'Reply');
    await expect(composer(page).locator('#composer-reply-preview, .cometchat-message-composer__reply-preview').first()).toContainText(original);
    const replyText = `Reply to quote [${RUN_ID}]`;
    const replyRow = await sendFromComposer(page, replyText);

    await expect(replyRow.locator('.cometchat-message-bubble__body-reply-view, [class*="reply-view"]').first()).toContainText(
      original
    );
  });

  // ──  Sticker panel closes after sending ─────────────────────────

  test('27.8 —  Sticker panel closes automatically after sending a sticker @quarantine (ENG-40832)', async () => {
    // @quarantine (ENG-40832): the E2E app has no sticker sets (stickers-<region>.cometchat.io/v1/fetch
    // returns empty defaultStickers and customStickers), so there is no sticker to send.
    await openChat(page, GEORGE);
    await composer(page).getByRole('button', { name: 'Sticker' }).click();
    const keyboard = page.locator('cometchat-stickers-keyboard');
    await expect(keyboard).toBeVisible();
    const sticker = keyboard.getByRole('gridcell').first();
    const empty = keyboard.getByText('No Stickers Available');
    await expect(sticker.or(empty)).toBeVisible({ timeout: 30_000 });
    await expect(empty, 'Set up the Stickers extension for the app in the dashboard').toHaveCount(0);
    await sticker.click();

    await expect(keyboard).toBeHidden({ timeout: 10_000 });
  });

  // ──  Message navigation from search scrolls to message ──────────

  test('27.9 —  Clicking a search result scrolls to and highlights the message', async () => {
    test.setTimeout(180_000);
    // The target was sent in beforeAll; make sure the search index has it.
    await expect
      .poll(async () => (await searchMessagesAs(PRIMARY_USER, SEARCH_TOKEN)).map((m) => m.id), { timeout: 120_000 })
      .toContain(searchTargetId);
    await tab(page, 'Chats').click();
    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    const result = search.getByTestId(`search-message-item-${searchTargetId}`);
    await expect(async () => {
      await search.getByRole('searchbox').fill(SEARCH_TOKEN);
      await expect(result).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    const id = searchTargetId;
    await result.click();

    const target = mainList(page).locator(`.cometchat-message-list__message[data-message-id="${id}"]`);
    // The highlight lasts two seconds, so check it before anything else.
    await expect(target).toHaveClass(/cometchat-message-list__message--highlighted/, { timeout: 30_000 });
    await expect(target).toBeInViewport();

    // Opening a result leaves the search panel in place of the Chats list; close it so the
    // next steps start from the tabs.
    await search.getByRole('button', { name: 'Back' }).click();
    await expect(search).toBeHidden();
  });

  // ──  Voice recording loads after sending ────────────────────────

  test('27.10 —  Voice recording bubble does not show "failed to load" after send', async () => {
    await openChat(page, GEORGE);
    await composer(page).getByRole('button', { name: 'Voice recording' }).click();
    const recorder = page.getByLabel('Voice recorder');
    await expect(recorder).toBeVisible();
    // Record a couple of seconds from the fake microphone (the recorder's timer shows them), then
    // send with the composer's Send.
    await expect(recorder).toContainText(/0?0:0[2-9]/, { timeout: 15_000 });
    await composer(page).locator('.cometchat-message-composer__send-button-inner:visible .cometchat-button').first().click();
    await expect(recorder).toBeHidden({ timeout: 15_000 });

    const note = lastRow(page).locator('cometchat-voice-note-bubble, cometchat-audio-bubble').first();
    await expect(note).toBeVisible({ timeout: 30_000 });
    await expect(lastRow(page)).not.toHaveAttribute('data-message-id', /^cc_/, { timeout: 30_000 });
    await expect(note.getByText(/failed to load/i)).toHaveCount(0);
    await expect(note.locator('[class*="error"]')).toHaveCount(0);
  });
});
