import { test, expect, Page, BrowserContext } from './fixtures/coverage';
import {
  loginToApp,
  openConversation,
  conversationRow,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  sendMessageAs,
  sendCustomAs,
  deleteMessageAs,
  addReactionAs,
  createE2EGroup,
  deleteGroup,
  searchMessagesAs,
  getUnreadCountAs,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  createE2EUser,
  uniqueTag,
} from './helpers';

/**
 * One long session as Andrew Joseph (primary user), walking through features in turn. George
 * Alan (secondary user) is signed in alongside in a second browser for the parts that need
 * someone on the other end: typing, read receipts and calls.
 *
 * Each test creates the message or group it acts on (REST, or the composer) and targets it by
 * its unique text or id, so no test depends on whatever happens to be first in a list.
 */

// A fake microphone and camera for voice recording and calls. Must be file-level: launch
// options can't change inside a describe group.
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

const RUN_ID = Date.now().toString(36);

// Every 1:1 step works in Andrew Joseph's chat with George Alan rather than whichever chat
// happens to be first: other specs keep creating groups that jump to the top of the list.
// The names are looked up in beforeAll: an isolated run (E2E_RUN_ID) uses users of its own.
// (Locally they are Andrew Joseph and George Alan, whom the comments below call them.)
let GEORGE = '';
let ANDREW = '';

const GROUP = { guid: `e2e-journey-${RUN_ID}`, name: `E2E Journey ${RUN_ID}` };

const MEDIA_AUDIO = {
  url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  name: 'e2e-audio.mp3',
  extension: 'mp3',
  mimeType: 'audio/mpeg',
  size: 1024,
};

const navTab = (page: Page, name: string) => page.getByLabel('Navigation tabs').getByRole('tab', { name });
const messageList = (page: Page) => page.locator('cometchat-message-list');
const composer = (page: Page) => page.locator('cometchat-message-composer');
const editor = (page: Page) => composer(page).locator('[contenteditable="true"]').first();

// The list row and the bubble inside it both carry data-message-id; target the row.
const bubble = (page: Page, messageId: string) =>
  page.locator(`cometchat-message-list .cometchat-message-list__message[data-message-id="${messageId}"]`);

/** The list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

/** Hover a message and open its "More options" menu. */
async function openMessageMenu(page: Page, text: string) {
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  // The menu button only renders while the bubble is hovered, and a click while it is still
  // appearing can be lost, so retry until the menu is open.
  await expect(async () => {
    await row.locator('.cometchat-message-bubble__body').first().hover();
    await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
    await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

/** Retry a REST call the server can refuse for a moment right after the message is created. */
const eventually = (call: () => Promise<unknown>) => expect(async () => { await call(); }).toPass({ timeout: 20_000 });

/** A custom message whose data the matching extension would normally inject server-side. */
const sendExtension = (type: string, extension: string, injected: object) =>
  sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
    category: 'custom',
    type,
    data: { customData: injected, metadata: { '@injected': { extensions: { [extension]: injected } } } },
  });

test.describe('Full App Journey — Extended', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let page: Page;
  let george: Page;
  const contexts: BrowserContext[] = [];

  /**
   * Reload Andrew's window and open the chat `name` at its latest message. In a long session,
   * messages that arrive at an open chat are sometimes never rendered (a known, intermittent UI
   * Kit defect; they show after a reload), and switching chats reuses the cached list. So tests
   * create their REST messages first, then load the chat fresh.
   */
  async function openFresh(name: string) {
    await page.reload();
    await expect(page.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
    await openConversation(page, name);
    await scrollToLatestMessage(page);
  }

  const backToGeorge = () => openFresh(GEORGE);

  /** Reload George's window and open his chat with Andrew (see openFresh for why). */
  async function georgeOpensAndrew() {
    await george.reload();
    await expect(george.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
    await openConversation(george, ANDREW);
  }

  test.beforeAll(async ({ browser }) => {
    [ANDREW, GEORGE] = await Promise.all([getUserName(PRIMARY_USER), getUserName(SECONDARY_USER)]);
    test.setTimeout(180_000);
    await createE2EGroup(GROUP.guid, GROUP.name, PRIMARY_USER, [SECONDARY_USER, THIRD_USER]);
    // Put George's chat at the top of Andrew's list so its row is on the first page.
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Full journey start ${RUN_ID}`);

    for (const uid of [PRIMARY_USER, SECONDARY_USER]) {
      const context = await browser.newContext({
        permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'],
      });
      contexts.push(context);
      const p = await context.newPage();
      await loginToApp(p, { userUid: uid });
      if (uid === PRIMARY_USER) page = p;
      else george = p;
    }
  });

  test.afterAll(async () => {
    for (const context of contexts) await context.close();
    await deleteGroup(GROUP.guid);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 27: POLL VOTING
  // ═══════════════════════════════════════════════════════════════

  test('27.1 — Vote on a poll message', async () => {
    await backToGeorge();
    await composer(page).getByRole('button', { name: 'Add attachment' }).click();
    await page.locator('[class*="action-sheet"]').getByText(/poll/i).first().click();
    const form = page.locator('cometchat-create-poll');
    await expect(form).toBeVisible();
    const question = `Journey poll ${RUN_ID}?`;
    await form.getByPlaceholder('Ask question').fill(question);
    await form.getByRole('textbox', { name: 'Options 1', exact: true }).fill('First');
    await form.getByRole('textbox', { name: 'Options 2', exact: true }).fill('Second');
    await form.getByRole('button', { name: 'Create' }).click();
    await expect(form.getByText('Something went wrong. Please try again.'), 'Poll creation failed: is the Polls extension enabled in the dashboard?').toBeHidden();
    await expect(form).toBeHidden({ timeout: 15_000 });

    const poll = rowWithText(page, question).locator('cometchat-poll-bubble');
    await expect(poll).toBeVisible({ timeout: 30_000 });
    const first = poll.getByRole('radio', { name: /First/ });
    await expect(first).not.toBeChecked();

    await first.click();

    await expect(first).toBeChecked({ timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 28: REMOVE REACTION
  // ═══════════════════════════════════════════════════════════════

  test('28.1 — Remove a reaction by clicking it again @smoke', async () => {
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `React to me ${RUN_ID}`);
    await eventually(() => addReactionAs(SECONDARY_USER, id, '👍'));
    await backToGeorge();
    const reactions = bubble(page, id).locator('cometchat-reactions');
    const pill = reactions.getByRole('button', { name: /^👍,/ });
    await expect(pill).toHaveAccessibleName('👍, 1 reactions', { timeout: 30_000 });
    await expect(pill).toHaveAttribute('aria-pressed', 'false');

    // Clicking George's reaction adds Andrew's own…
    await pill.click();
    await expect(pill).toHaveAccessibleName('👍, 2 reactions, you reacted', { timeout: 15_000 });
    await expect(pill).toHaveAttribute('aria-pressed', 'true');

    // …and clicking it again removes it.
    await pill.click();

    await expect(pill).toHaveAccessibleName('👍, 1 reactions', { timeout: 15_000 });
    await expect(pill).toHaveAttribute('aria-pressed', 'false');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 29: REACTION INFO (who reacted)
  // ═══════════════════════════════════════════════════════════════

  test('29.1 — Hover a reaction to see who reacted', async () => {
    // Known UI Kit defect (ENG-40637): one hover doesn't open the reaction info. This test used to
    // move away and hover again for up to 30s, which hid that; a customer hovers once. Expected to
    // fail until fixed (as reactions.spec.ts "hovering a reaction shows reaction info").
    test.fail();
    const id = await sendTextAs(PRIMARY_USER, SECONDARY_USER, `Who reacted ${RUN_ID}`);
    await eventually(() => addReactionAs(SECONDARY_USER, id, '🎉'));
    await backToGeorge();
    const pill = bubble(page, id).locator('cometchat-reactions').getByRole('button', { name: /🎉, 1 reactions/ });
    await expect(pill).toBeVisible({ timeout: 30_000 });

    // One hover, as a person gives it: the info must open from it, after its short delay. The
    // pointer starts away from the pill, so the hover is a fresh mouseenter.
    const info = page.locator('.cometchat-reaction-info');
    await page.mouse.move(0, 0);
    await pill.hover();
    await expect(info).toBeVisible({ timeout: 10_000 });

    await expect(info).toContainText(GEORGE, { timeout: 15_000 });
    await expect(info).toContainText('reacted');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 30: DELETE BUBBLE RENDERING
  // ═══════════════════════════════════════════════════════════════

  test('30.1 — Deleted message shows "This message was deleted" bubble', async () => {
    const text = `Soon deleted ${RUN_ID}`;
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await eventually(() => deleteMessageAs(SECONDARY_USER, id));

    await backToGeorge();

    await expect(bubble(page, id).locator('cometchat-delete-bubble')).toContainText('This message was deleted', {
      timeout: 30_000,
    });
    await expect(bubble(page, id)).not.toContainText(text);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 31: AUDIO BUBBLE PLAYBACK
  // ═══════════════════════════════════════════════════════════════

  test('31.1 — Play an audio message', async () => {
    const id = await sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'message',
      type: 'audio',
      data: { attachments: [MEDIA_AUDIO] },
    });
    await backToGeorge();
    const audio = bubble(page, id).locator('cometchat-audios-bubble');
    await expect(audio).toBeVisible({ timeout: 30_000 });

    await audio.getByRole('button', { name: 'Play audio' }).click();

    const pause = audio.getByRole('button', { name: 'Pause audio' });
    await expect(pause).toBeVisible({ timeout: 15_000 });
    await pause.click();
    await expect(audio.getByRole('button', { name: 'Play audio' })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 32: VOICE RECORDING — FULL FLOW
  // ═══════════════════════════════════════════════════════════════

  test('32.1 — Start voice recording, stop, and send', async () => {
    await backToGeorge();
    const newestVoiceNoteId = () =>
      messageList(page)
        .locator('.cometchat-message-list__message')
        .filter({ has: page.locator('.cometchat-message-bubble__wrapper--outgoing cometchat-voice-note-bubble') })
        .evaluateAll((rows) => Math.max(0, ...rows.map((r) => Number(r.getAttribute('data-message-id')) || 0)));
    const before = await newestVoiceNoteId();

    await composer(page).getByRole('button', { name: 'Voice recording' }).click();
    const recorder = page.getByLabel('Voice recorder');
    // Recording starts on its own; the Pause control shows while it runs.
    await expect(recorder.getByRole('button', { name: 'Pause recording' })).toBeVisible({ timeout: 15_000 });
    await expect(recorder.getByRole('timer')).not.toHaveText(/^\s*0?0:00\s*$/, { timeout: 10_000 });

    // Send stops the recording and sends it as a voice note.
    await composer(page).getByRole('button', { name: 'Send message' }).click();

    await expect(recorder).toBeHidden({ timeout: 15_000 });
    await expect.poll(newestVoiceNoteId, { timeout: 30_000 }).toBeGreaterThan(before);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 33: TEXT FORMATTING IN COMPOSER
  // ═══════════════════════════════════════════════════════════════

  test('33.1 — Bold text formatting in composer', async () => {
    await backToGeorge();
    const bold = `bold journey ${RUN_ID}`;
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.type(bold);
    await page.keyboard.press('ControlOrMeta+b');
    await expect(editor(page).locator('strong, b').filter({ hasText: bold })).toBeVisible();
    await page.keyboard.type(' plain');
    await page.keyboard.press('Enter');

    const sent = rowWithText(page, bold);
    await expect(sent.locator('strong').filter({ hasText: bold })).toBeVisible({ timeout: 30_000 });
    await expect(sent.locator('strong')).not.toContainText('plain');
    await expect(sent).not.toContainText('**');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 34: CONVERSATION CONTEXT MENU — PIN & DELETE
  // ═══════════════════════════════════════════════════════════════

  test('34.1 — Conversation context menu offers Pin and Delete, and Delete asks first', async () => {
    // The row menu has no "Mark as read" option in this UI Kit: it offers Pin/Unpin and Delete.
    await navTab(page, 'Chats').click();
    const row = conversationRow(page, GEORGE);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await row.hover();
      await row.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole('menuitem', { name: /^(Pin|Unpin) conversation$/ })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.locator('.cometchat-conversations__dialog-overlay');
    await expect(dialog).toContainText('Delete Conversation?');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(row).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 35: SEARCH — NAVIGATE TO MESSAGE
  // ═══════════════════════════════════════════════════════════════

  test('35.1 — Search result click navigates to message', async () => {
    // The search index skips words that end in a long number, so the keyword is letters only.
    const token = `journeyfind${RUN_ID.replace(/[0-9]/g, (d) => 'qwertyuiop'[Number(d)])}`;
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Look for ${token} here`);
    // Push the target off the bottom so jumping to it has to scroll.
    for (let i = 1; i <= 12; i++) await sendTextAs(SECONDARY_USER, PRIMARY_USER, `After the search target ${i} [${RUN_ID}]`);
    // New messages take a few seconds to reach the search index.
    await expect
      .poll(async () => (await searchMessagesAs(PRIMARY_USER, token)).map((m) => m.id), { timeout: 60_000 })
      .toContain(id);
    await navTab(page, 'Chats').click();
    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    await expect(search).toBeVisible();
    const result = search.getByTestId(`search-message-item-${id}`);
    // Search is debounced and results arrive async; retype until the result shows.
    await expect(async () => {
      await search.getByRole('searchbox').fill(token);
      await expect(result).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });

    await result.click();

    await expect(page.locator('cometchat-message-header')).toContainText(GEORGE);
    const target = page.locator(`cometchat-messages .cometchat-message-list__message[data-message-id="${id}"]`);
    await expect(target).toBeInViewport({ timeout: 15_000 });
    await expect(target).toHaveClass(/cometchat-message-list__message--highlighted/);

    // Search stays open over the side panel after a result is opened; close it.
    await search.getByRole('button', { name: 'Back' }).click();
    await expect(search).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 36: GROUP MEMBERS — SCOPE CHANGE
  // ═══════════════════════════════════════════════════════════════

  test('36.1 — Open group members and change a member\'s scope', async () => {
    await openFresh(GROUP.name);
    await page.locator('cometchat-message-header .cometchat-message-header__info').first().click();
    const details = page.locator('cometchat-group-details');
    await expect(details).toBeVisible();
    const member = details.locator('cometchat-group-member-item').filter({ hasText: GEORGE });
    await expect(member).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await member.hover();
      await member.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await expect(page.getByRole('menuitem', { name: 'Change Scope' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await page.getByRole('menuitem', { name: 'Change Scope' }).click();
    const dialog = page.locator('.cometchat-change-scope');
    await expect(dialog).toBeVisible();
    for (const scope of ['Admin', 'Moderator', 'Participant']) {
      await expect(dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: scope })).toBeVisible();
    }
    await dialog.locator('.cometchat-change-scope__list-item').filter({ hasText: 'Moderator' }).locator('.cometchat-radio-button__label').click();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(member).toContainText('Moderator', { timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 37: TYPING INDICATOR
  // ═══════════════════════════════════════════════════════════════

  test('37.1 — Typing in composer shows "Typing..." to the other user @realtime', async () => {
    await backToGeorge();
    await georgeOpensAndrew();
    const georgeHeader = george.locator('cometchat-message-header');
    await expect(georgeHeader).not.toContainText('Typing...');

    await editor(page).click();
    await page.keyboard.type('typing in progress');

    await expect(georgeHeader).toContainText('Typing...', { timeout: 15_000 });

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await expect(georgeHeader).not.toContainText('Typing...', { timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 38: CALL LOGS — ENTRY INTERACTION
  // ═══════════════════════════════════════════════════════════════

  test('38.1 — Call log entry shows type and status', async () => {
    await backToGeorge();
    // Make a call to log: Andrew calls George and cancels while it rings.
    const outgoing = page.locator('cometchat-outgoing-call');
    // The header re-renders right after the chat opens and can drop the first click.
    await expect(async () => {
      await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click({ timeout: 2_000 });
      await expect(outgoing).toContainText(GEORGE, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await outgoing.locator('.cometchat-outgoing-call__button').getByRole('button').click();
    await expect(outgoing).toBeHidden({ timeout: 15_000 });

    await navTab(page, 'Calls').click();

    const newest = page.locator('cometchat-call-logs .cometchat-call-logs__list-item').first();
    await expect(newest).toHaveAttribute('aria-label', new RegExp(`^${GEORGE}, voice call, Outgoing call`), {
      timeout: 30_000,
    });
    await expect(newest.locator('.cometchat-call-logs__list-item-subtitle-icon-outgoing-call')).toBeVisible();
    await expect(newest.getByRole('button', { name: `voice call ${GEORGE}` })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 39: COLLABORATIVE DOCUMENT BUBBLE — OPEN BUTTON
  // ═══════════════════════════════════════════════════════════════

  test('39.1 — Collaborative document bubble has Open button', async () => {
    const url = `https://www.cometchat.com/e2e-doc-${RUN_ID}`;
    const id = await sendExtension('extension_document', 'document', { document_url: url });
    await backToGeorge();
    const doc = bubble(page, id).locator('cometchat-collaborative-document-bubble');
    await expect(doc).toContainText('Collaborative Document', { timeout: 30_000 });

    const popup = page.waitForEvent('popup');
    await doc.getByRole('button', { name: 'Open Document' }).click();

    const opened = await popup;
    expect(opened.url()).toContain(`e2e-doc-${RUN_ID}`);
    await opened.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 40: WHITEBOARD BUBBLE — OPEN BUTTON
  // ═══════════════════════════════════════════════════════════════

  test('40.1 — Collaborative whiteboard bubble has Open button', async () => {
    const url = `https://www.cometchat.com/e2e-board-${RUN_ID}`;
    const id = await sendExtension('extension_whiteboard', 'whiteboard', { board_url: url });
    await backToGeorge();
    const board = bubble(page, id).locator('cometchat-collaborative-whiteboard-bubble');
    await expect(board).toContainText('Collaborative Whiteboard', { timeout: 30_000 });

    const popup = page.waitForEvent('popup');
    await board.getByRole('button', { name: 'Open Whiteboard' }).click();

    const opened = await popup;
    expect(opened.url()).toContain(`e2e-board-${RUN_ID}`);
    await opened.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 41: TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════

  test('41.1 — Toast notification appears after message action', async () => {
    const text = `Copy me ${RUN_ID}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await backToGeorge();

    await openMessageMenu(page, text);
    // Take Copy from the open options sheet: it is portaled out of the row, and another row can
    // show its own quick-action Copy at the same time.
    await page
      .locator('.cometchat-menu-list__sub-menu-list[data-visible="true"]')
      .getByRole('menuitem', { name: 'Copy' })
      .click();

    await expect(page.getByText('Message copied to clipboard.')).toBeVisible({ timeout: 10_000 });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 42: UNREAD BADGE ON CONVERSATION ITEM
  // ═══════════════════════════════════════════════════════════════

  test('42.1 — Unread badge appears on conversation with unread messages @realtime', async () => {
    // A new user of this test's own, so Andrew never has their chat open.
    const tag = uniqueTag();
    const sender = `e2e-unread-${tag}`;
    const senderName = `E2E Unread ${tag}`;
    await createE2EUser(sender, senderName);
    // The E2E app's server never returns the first message of a new 1:1 conversation to the
    // receiver (the client message fetch comes back empty, though the Chats row shows it), so
    // open the conversation with a message this test doesn't look for.
    await sendTextAs(sender, PRIMARY_USER, 'Hello there');
    await sendTextAs(sender, PRIMARY_USER, `Unread one ${RUN_ID}`);
    // Start from zero: opening their chat reads everything, then move back to George's.
    await openFresh(senderName);
    await expect(rowWithText(page, `Unread one ${RUN_ID}`)).toBeVisible({ timeout: 30_000 });
    const badge = conversationRow(page, senderName).locator('.cometchat-conversation-item__badge');
    await expect(badge).toBeHidden({ timeout: 30_000 });
    await expect.poll(() => getUnreadCountAs(PRIMARY_USER, sender), { timeout: 15_000 }).toBe(0);
    await backToGeorge();
    // Hovering a row swaps its badge for the menu button; keep the pointer off the list.
    await page.mouse.move(800, 30);

    await sendTextAs(sender, PRIMARY_USER, `Unread two ${RUN_ID}`);
    await sendTextAs(sender, PRIMARY_USER, `Unread three ${RUN_ID}`);

    await expect(badge).toHaveText(/^\s*2\s*$/, { timeout: 30_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 43: GROUPS — SEARCH
  // ═══════════════════════════════════════════════════════════════

  test('43.1 — Search within groups list filters results', async () => {
    await navTab(page, 'Groups').click();
    const groups = page.locator('cometchat-groups');
    const items = groups.locator('cometchat-group-item');
    await expect(items.first()).toBeVisible({ timeout: 30_000 });

    // Search typed before the list first renders can be ignored, so retype until it applies.
    await expect(async () => {
      await groups.getByRole('searchbox').fill(GROUP.name);
      await expect(items).toHaveCount(1, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(items.first()).toContainText(GROUP.name);

    await groups.getByRole('searchbox').fill(`no group matches ${RUN_ID}`);
    await expect(items).toHaveCount(0, { timeout: 15_000 });
    await groups.getByRole('searchbox').fill('');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 44: USERS — SEARCH
  // ═══════════════════════════════════════════════════════════════

  test('44.1 — Search within users list filters results', async () => {
    await navTab(page, 'Users').click();
    const users = page.locator('cometchat-users');
    const items = users.locator('cometchat-user-item');
    await expect(items.first()).toBeVisible({ timeout: 30_000 });

    await expect(async () => {
      await users.getByRole('searchbox').fill(GEORGE);
      await expect(items).toHaveCount(1, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(items.first()).toContainText(GEORGE);

    await users.getByRole('searchbox').fill(`no user matches ${RUN_ID}`);
    await expect(items).toHaveCount(0, { timeout: 15_000 });
    await users.getByRole('searchbox').fill('');
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 45: STICKER BUBBLE RENDERING
  // ═══════════════════════════════════════════════════════════════

  test('45.1 — Sticker message renders as sticker bubble', async () => {
    const id = await sendCustomAs(SECONDARY_USER, PRIMARY_USER, 'extension_sticker', {
      sticker_url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-3.webp',
      sticker_name: 'e2e',
    });
    await backToGeorge();

    const sticker = bubble(page, id).locator('cometchat-sticker-bubble img');
    await expect(sticker).toBeVisible({ timeout: 30_000 });
    // The image actually loaded, not just a broken <img>.
    await expect.poll(() => sticker.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 46: MESSAGE LIST — SCROLL TO BOTTOM BUTTON
  // ═══════════════════════════════════════════════════════════════

  test('46.1 — Scroll to bottom button appears when scrolled up', async () => {
    await backToGeorge();
    const scrollButton = page.locator('.cometchat-message-list__scroll-to-bottom');
    const latest = messageList(page).locator('.cometchat-message-list__message').last();
    await expect(scrollButton).toBeHidden();

    // The seeded chat has more than a page of messages, so scrolling up leaves the bottom.
    await latest.hover();
    await expect(async () => {
      await page.mouse.wheel(0, -1_500);
      await expect(scrollButton).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    await expect(latest).not.toBeInViewport();

    await scrollButton.locator('cometchat-button').click();

    await expect(scrollButton).toBeHidden({ timeout: 15_000 });
    await expect(messageList(page).locator('.cometchat-message-list__message').last()).toBeInViewport();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 47: MESSAGE LIST — DATE SEPARATORS
  // ═══════════════════════════════════════════════════════════════

  test('47.1 — Date separators appear between message groups', async () => {
    await backToGeorge();
    // Today's messages sit under a "Today" separator.
    const separators = messageList(page).locator('.cometchat-message-list__date-separator');
    await expect(separators.filter({ hasText: 'Today' })).toHaveCount(1, { timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 48: MESSAGE RECEIPTS
  // ═══════════════════════════════════════════════════════════════

  test('48.1 — Sent messages show read receipts @realtime @quarantine (ENG-40623)', async () => {
    // @quarantine (ENG-40623): intermittent UI Kit defect, seen under load — George reads the
    // message (the server records readAt) but Andrew's open chat keeps "Message delivered"; a
    // reload shows "Message read". 0 of 6 isolated runs, 1 of 3 parallel runs, so it can't be
    // test.fail.
    // George is on another screen, so the message can't be read yet.
    await navTab(george, 'Users').click();
    // Moderation's AI rules flagged "Receipt check <id>" once (AI Platform Circumvention); keep
    // the text plainly conversational.
    const text = `Thanks, see you at lunch ${RUN_ID}`;
    const id = await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await backToGeorge();
    const receipt = bubble(page, id).locator('.cometchat-receipts');
    await expect(receipt).toHaveAttribute('aria-label', /Message (sent|delivered)/, { timeout: 30_000 });

    // Delivery to George's session sometimes lags, so reload until he has the message.
    await expect(async () => {
      await georgeOpensAndrew();
      await expect(george.locator('cometchat-message-list').getByText(text)).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 75_000 });
    await scrollToLatestMessage(george);

    await expect(receipt).toHaveAttribute('aria-label', 'Message read', { timeout: 30_000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 49: INCOMING CALL — ACCEPT/DECLINE UI
  // ═══════════════════════════════════════════════════════════════

  test('49.1 — Incoming call component renders when call arrives', async () => {
    await backToGeorge();
    await georgeOpensAndrew();
    await george.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click();
    const georgeOutgoing = george.locator('cometchat-outgoing-call');
    await expect(georgeOutgoing).toContainText(ANDREW, { timeout: 15_000 });

    const incoming = page.locator('.cometchat-incoming-call');
    try {
      await expect(incoming).toContainText(GEORGE, { timeout: 30_000 });
      await expect(incoming).toContainText('Incoming Call');
      await expect(incoming.getByRole('button', { name: 'Accept' })).toBeVisible();

      await incoming.getByRole('button', { name: 'Decline' }).click();

      await expect(incoming).toBeHidden({ timeout: 15_000 });
      await expect(georgeOutgoing).toBeHidden({ timeout: 30_000 });
    } finally {
      // Never leave a call ringing: a stuck call makes later calls fail as "busy".
      if (await georgeOutgoing.isVisible()) {
        await georgeOutgoing.locator('.cometchat-outgoing-call__button').getByRole('button').click();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 50: CONFIRM DIALOG — CANCEL PATH
  // ═══════════════════════════════════════════════════════════════

  test('50.1 — Confirm dialog cancel button dismisses without action', async () => {
    const text = `Cancel delete test [${RUN_ID}]`;
    const id = await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await backToGeorge();
    await expect(bubble(page, id)).toContainText(text, { timeout: 30_000 });

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.locator('cometchat-message-list cometchat-confirm-dialog');
    await expect(dialog).toContainText('Delete Message?');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(bubble(page, id)).toContainText(text);
    await expect(bubble(page, id).locator('cometchat-delete-bubble')).toHaveCount(0);
  });
});
