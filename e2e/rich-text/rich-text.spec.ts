import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
  waitForModeration,
  searchMessagesAs,
} from '../helpers';

/**
 * E2E Tests — Rich Text Formatting (Comprehensive)
 *
 * Full Slack-level coverage of rich text formatting:
 * 1. Toolbar visibility & all buttons present
 * 2. Each format: bold, italic, underline, strikethrough, inline code,
 *    code block, blockquote, ordered list, unordered list, link
 * 3. Format renders correctly in text bubble after send
 * 4. Format renders in conversation last-message preview
 * 5. Format renders in reply preview (quoted reply)
 * 6. Format renders in edit preview
 * 7. Format renders in search results
 * 8. Format renders in thread view
 * 9. Combination matrix — which formats compose and which are mutually exclusive
 * 10. Mentions combined with rich text
 *
 * Every test runs in the seeded 1:1 chat between PRIMARY_USER and SECONDARY_USER (the
 * mention tests in a group of their own), and every assertion waits on UI state.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Log in and open the seeded 1:1 chat with the secondary user, at its latest message. */
async function openSecondaryChat(page: Page): Promise<void> {
  const secondaryName = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  await expect(composerInput(page)).toBeVisible();
}

/** The main chat's composer (the thread panel has a composer of its own). */
function composer(page: Page): Locator {
  return page.locator('cometchat-messages cometchat-message-composer').first();
}

/** The contenteditable input inside the main composer. */
function composerInput(page: Page): Locator {
  return composer(page).locator('[contenteditable="true"]').first();
}

/** The composer's fixed formatting toolbar. */
function toolbar(page: Page): Locator {
  return composer(page).locator('.cometchat-message-composer__toolbar');
}

/** A formatting toolbar button by its exact translated aria-label. */
function toolbarButton(page: Page, label: string): Locator {
  return toolbar(page).getByRole('button', { name: label, exact: true });
}

/** The main list's row of the most recent message containing `text`. */
function rowWithText(page: Page, text: string): Locator {
  return page.locator('cometchat-messages .cometchat-message-list__message').filter({ hasText: text }).last();
}

/** The rendered text of the most recent text bubble containing `text`. */
function bubbleText(page: Page, text: string): Locator {
  return rowWithText(page, text).locator('.cometchat-text-bubble__text').first();
}

/** Clear the composer input and wait until it is empty. */
async function clearInput(page: Page): Promise<void> {
  await composerInput(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await expect(composerInput(page)).toHaveText('');
}

/** Type `text` into the composer and select all of it. */
async function typeAndSelectAll(page: Page, text: string): Promise<void> {
  await composerInput(page).click();
  await page.keyboard.type(text);
  await page.keyboard.press('ControlOrMeta+a');
}

/** Click the composer's send button (Enter inside a list or code block adds a line instead). */
async function clickSend(page: Page): Promise<void> {
  await composer(page).getByRole('button', { name: 'Send message' }).click();
}

/**
 * Send `text` with a format applied to all of it: a keyboard shortcut (e.g. 'ControlOrMeta+b')
 * or a toolbar button label (e.g. 'Quote'). Waits until the sent bubble shows the text.
 */
async function sendFormattedMessage(page: Page, text: string, format: { shortcut?: string; button?: string }) {
  await typeAndSelectAll(page, text);
  if (format.shortcut) await page.keyboard.press(format.shortcut);
  if (format.button) await toolbarButton(page, format.button).click();
  await clickSend(page);
  await expect(bubbleText(page, text)).toBeVisible({ timeout: 30_000 });
  await expect(composerInput(page)).toHaveText('');
}

/** A unique token of letters only: server search splits words that mix letters and digits. */
function letterToken(prefix: string): string {
  return `${prefix}${uniqueTag().replace(/\d/g, (d) => 'abcdefghij'[Number(d)])}`;
}

/** Hover a main-list message and open its "More options" menu. */
async function openMessageMenu(page: Page, text: string): Promise<void> {
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.locator('.cometchat-message-bubble__body').first().hover();
  await row.getByRole('button', { name: 'More options' }).click();
}

/** Choose a message action ("Reply", "Edit", "Reply in thread"): a quick button on the bubble or a menu item. */
async function chooseMessageAction(page: Page, text: string, action: string): Promise<void> {
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.locator('.cometchat-message-bubble__body').first().hover();
  // The bubble's quick actions are menu items shown on hover; the rest sit in "More options".
  const options = row.locator('.cometchat-message-bubble__options');
  await expect(options.getByRole('button', { name: 'More options' })).toBeVisible();
  const quick = options
    .getByRole('menuitem', { name: action, exact: true })
    .filter({ visible: true });
  if (await quick.count()) {
    await quick.click();
  } else {
    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: action, exact: true }).filter({ visible: true }).click();
  }
}

const replyPreview = (page: Page) => composer(page).locator('.cometchat-message-composer__reply-preview');
const threadPanel = (page: Page) => page.locator('.cometchat-threaded-messages');

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe('Rich Text — Toolbar Visibility', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('formatting toolbar is visible in the composer', async () => {
    await expect(toolbar(page)).toBeVisible();
    await expect(toolbar(page)).toHaveAttribute('role', 'toolbar');
  });

  test('bold button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Bold')).toBeVisible();
  });

  test('italic button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Italic')).toBeVisible();
  });

  test('strikethrough button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Strikethrough')).toBeVisible();
  });

  test('inline code button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Inline code')).toBeVisible();
  });

  test('code block button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Code block')).toBeVisible();
  });

  test('blockquote button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Quote')).toBeVisible();
  });

  test('ordered list button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Numbered list')).toBeVisible();
  });

  test('unordered list button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Bulleted list')).toBeVisible();
  });
});

// ─── Individual Format: Composer DOM Verification ───────────────────────────

test.describe('Rich Text — Format Applied in Composer', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('bold (Cmd+B) wraps selection in <strong>', async () => {
    await typeAndSelectAll(page, 'bold test');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText('bold test');
    await clearInput(page);
  });

  test('italic (Cmd+I) wraps selection in <em>', async () => {
    await typeAndSelectAll(page, 'italic test');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(composerInput(page).locator('em, i')).toHaveText('italic test');
    await clearInput(page);
  });

  test('underline (Cmd+U) wraps selection in <u>', async () => {
    await typeAndSelectAll(page, 'underline test');
    await page.keyboard.press('ControlOrMeta+u');
    await expect(composerInput(page).locator('u')).toHaveText('underline test');
    await clearInput(page);
  });

  test('strikethrough toolbar button wraps selection in <s> or <del>', async () => {
    await typeAndSelectAll(page, 'strike test');
    await toolbarButton(page, 'Strikethrough').click();
    await expect(composerInput(page).locator('s, del, strike')).toHaveText('strike test');
    await clearInput(page);
  });

  test('inline code toolbar button wraps selection in <code>', async () => {
    await typeAndSelectAll(page, 'const x = 1');
    await toolbarButton(page, 'Inline code').click();
    await expect(composerInput(page).locator('code')).toHaveText('const x = 1');
    await clearInput(page);
  });

  test('code block toolbar button wraps content in <pre><code>', async () => {
    await typeAndSelectAll(page, 'function hello() {}');
    await toolbarButton(page, 'Code block').click();
    await expect(composerInput(page).locator('pre')).toContainText('function hello() {}');
    await clearInput(page);
  });

  test('blockquote toolbar button wraps content in <blockquote>', async () => {
    await typeAndSelectAll(page, 'quoted text');
    await toolbarButton(page, 'Quote').click();
    await expect(composerInput(page).locator('blockquote')).toContainText('quoted text');
    await clearInput(page);
  });

  test('ordered list toolbar button creates <ol>', async () => {
    await composerInput(page).click();
    await page.keyboard.type('first item');
    await toolbarButton(page, 'Numbered list').click();
    await expect(composerInput(page).locator('ol > li')).toHaveText('first item');
    await clearInput(page);
  });

  test('unordered list toolbar button creates <ul>', async () => {
    await composerInput(page).click();
    await page.keyboard.type('bullet item');
    await toolbarButton(page, 'Bulleted list').click();
    await expect(composerInput(page).locator('ul > li')).toHaveText('bullet item');
    await clearInput(page);
  });
});

// ─── Format Renders in Text Bubble After Send ────────────────────────────────

test.describe('Rich Text — Renders in Text Bubble', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('bold message renders <strong> in text bubble', async () => {
    const tag = `bold-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });
    await expect(bubbleText(page, tag).locator('strong, b')).toHaveText(tag);
  });

  test('italic message renders <em> in text bubble', async () => {
    const tag = `italic-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+i' });
    await expect(bubbleText(page, tag).locator('em, i')).toHaveText(tag);
  });

  test('underline message renders <u> in text bubble', async () => {
    const tag = `underline-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+u' });
    await expect(bubbleText(page, tag).locator('u')).toHaveText(tag);
  });

  test('strikethrough message renders <s> in text bubble', async () => {
    const tag = `strike-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Strikethrough' });
    await expect(bubbleText(page, tag).locator('s, del, strike')).toHaveText(tag);
  });

  test('inline code message renders <code> in text bubble', async () => {
    const tag = `code-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Inline code' });
    await expect(bubbleText(page, tag).locator('code')).toHaveText(tag);
  });

  test('code block message renders <pre> in text bubble', async () => {
    const tag = `codeblock-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Code block' });
    await expect(bubbleText(page, tag).locator('pre')).toContainText(tag);
  });

  test('blockquote message renders <blockquote> in text bubble', async () => {
    const tag = `quote-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Quote' });
    await expect(bubbleText(page, tag).locator('blockquote')).toContainText(tag);
  });

  test('ordered list message renders <ol> in text bubble', async () => {
    const tag = `ol-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Numbered list' });
    await expect(bubbleText(page, tag).locator('ol > li')).toHaveText(tag);
  });

  test('unordered list message renders <ul> in text bubble', async () => {
    const tag = `ul-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Bulleted list' });
    await expect(bubbleText(page, tag).locator('ul > li')).toHaveText(tag);
  });
});

// ─── Format Renders in Conversation Last-Message Preview ─────────────────────

test.describe('Rich Text — Conversation Last-Message Preview', () => {
  let page: Page;
  let secondaryName: string;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    secondaryName = await getUserName(SECONDARY_USER);
    await openSecondaryChat(page);
  });

  /** The last-message preview of the chat with the secondary user. */
  const preview = () => conversationRow(page, secondaryName).locator('.cometchat-conversation-item__subtitle-text');

  test('bold message shows text (not raw markdown) in conversation preview', async () => {
    const tag = `bold-preview-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });
    // Exactly the text: no ** markers around it.
    await expect(preview()).toHaveText(tag, { timeout: 30_000 });
  });

  test('italic message shows text (not raw markdown) in conversation preview', async () => {
    const tag = `italic-preview-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+i' });
    await expect(preview()).toHaveText(tag, { timeout: 30_000 });
  });

  test('code message shows text (not raw backticks) in conversation preview', async () => {
    const tag = `code-preview-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { button: 'Inline code' });
    await expect(preview()).toHaveText(tag, { timeout: 30_000 });
  });
});

// ─── Format Renders in Reply Preview ─────────────────────────────────────────

test.describe('Rich Text — Reply Preview', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('reply preview shows formatted content of the quoted message', async () => {
    const tag = `reply-src-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });

    await chooseMessageAction(page, tag, 'Reply');

    await expect(replyPreview(page)).toBeVisible();
    await expect(replyPreview(page)).toContainText(tag);
  });

  test('reply preview for a bold message does not show raw ** markers', async () => {
    const tag = `bold-reply-src-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });

    await chooseMessageAction(page, tag, 'Reply');

    await expect(replyPreview(page)).toContainText(tag);
    await expect(replyPreview(page)).not.toContainText('**');
  });

  test('sending a reply to a formatted message includes quoted reference in bubble', async () => {
    const tag = `reply-quoted-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });

    await chooseMessageAction(page, tag, 'Reply');
    await expect(replyPreview(page)).toContainText(tag);

    const replyMsg = `reply-check-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(replyMsg);
    await page.keyboard.press('Enter');

    const sent = rowWithText(page, replyMsg);
    await expect(sent.locator('.cometchat-message-bubble__body-reply-view')).toContainText(tag, { timeout: 30_000 });
    await expect(sent.locator('.cometchat-message-bubble__body-reply-view')).not.toContainText('**');
  });
});

// ─── Format Renders in Edit Preview ──────────────────────────────────────────

test.describe('Rich Text — Edit Preview', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('editing a plain message opens composer with existing text', async () => {
    const plainTag = `edit-src-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(plainTag);
    await page.keyboard.press('Enter');
    await expect(bubbleText(page, plainTag)).toBeVisible({ timeout: 30_000 });

    await chooseMessageAction(page, plainTag, 'Edit');

    await expect(composer(page)).toContainText('Editing message');
    await expect(composerInput(page)).toHaveText(plainTag);
  });

  test('editing a bold message re-populates composer with bold formatting intact', async () => {
    const boldTag = `edit-bold-${uniqueTag()}`;
    await sendFormattedMessage(page, boldTag, { shortcut: 'ControlOrMeta+b' });

    await chooseMessageAction(page, boldTag, 'Edit');

    await expect(composer(page)).toContainText('Editing message');
    await expect(composerInput(page).locator('strong, b')).toHaveText(boldTag);
    await composer(page).locator('.cometchat-message-preview__close').click();
    await expect(composer(page)).not.toContainText('Editing message');
  });

  test('editing a message and adding bold then saving updates the bubble', async () => {
    const editTag = `edit-apply-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(editTag);
    await page.keyboard.press('Enter');
    await expect(bubbleText(page, editTag)).toBeVisible({ timeout: 30_000 });
    await expect(bubbleText(page, editTag).locator('strong, b')).toHaveCount(0);
    // The E2E app moderates messages, and the server refuses to edit one still under review
    // (403 ERR_MESSAGE_NO_ACCESS). Wait for its server id, then for moderation to pass it.
    const row = rowWithText(page, editTag);
    await expect(row).toHaveAttribute('data-message-id', /^\d+$/, { timeout: 30_000 });
    await waitForModeration((await row.getAttribute('data-message-id'))!);

    await chooseMessageAction(page, editTag, 'Edit');
    await expect(composerInput(page)).toHaveText(editTag);
    await composerInput(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText(editTag);
    await page.keyboard.press('Enter');

    await expect(rowWithText(page, editTag)).toContainText('Edited', { timeout: 30_000 });
    await expect(bubbleText(page, editTag).locator('strong, b')).toHaveText(editTag);
  });
});

// ─── Format Renders in Search Results ────────────────────────────────────────

test.describe('Rich Text — Search Results', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  /** Search all chats for `token` and return the message result showing it. */
  async function searchResult(token: string): Promise<Locator> {
    // The server indexes a new message for search after a delay, and the search panel keeps
    // the empty result of a keyword searched too early. Wait until the server finds it.
    await expect
      .poll(async () => (await searchMessagesAs(PRIMARY_USER, token)).length, { timeout: 60_000 })
      .toBeGreaterThan(0);
    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    await expect(search).toBeVisible();
    const result = search.locator('[data-testid^="search-message-item-"]').filter({ hasText: token }).first();
    // Search is debounced: retype (clearing first, as the same keyword is not searched again) until shown.
    await expect(async () => {
      await search.getByRole('searchbox').fill('');
      await search.getByRole('searchbox').fill(token);
      await expect(result).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    return result;
  }

  test('bold message text is findable via search (plain text match)', async () => {
    const searchTag = letterToken('searchbold');
    await sendFormattedMessage(page, searchTag, { shortcut: 'ControlOrMeta+b' });

    const result = await searchResult(searchTag);
    await expect(result).not.toContainText('**');
  });

  test('italic message text is findable via search (plain text match)', async () => {
    const searchTag = letterToken('searchitalic');
    await sendFormattedMessage(page, searchTag, { shortcut: 'ControlOrMeta+i' });

    const result = await searchResult(searchTag);
    await expect(result).not.toContainText(`_${searchTag}_`);
    await expect(result).not.toContainText(`*${searchTag}*`);
  });
});

// ─── Format Renders in Thread View ───────────────────────────────────────────

test.describe('Rich Text — Thread View', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  /** Open the thread of the main-list message containing `text`. */
  async function openThread(text: string) {
    const row = rowWithText(page, text);
    await expect(row).toHaveAttribute('data-message-id', /^\d+$/, { timeout: 30_000 });
    const parentId = await row.getAttribute('data-message-id');
    // A reply sent before the thread's first load completes may never show (ENG-39944).
    const firstLoad = page.waitForResponse(
      (r) => r.request().method() === 'GET' && r.url().includes(`/messages/${parentId}/thread`),
      { timeout: 30_000 }
    );
    await chooseMessageAction(page, text, 'Reply in thread');
    await expect(threadPanel(page).locator('cometchat-thread-header')).toContainText(text);
    await firstLoad;
  }

  test('bold message sent in thread renders <strong> in thread bubble', async () => {
    const parent = `thread-parent-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(parent);
    await page.keyboard.press('Enter');
    await expect(bubbleText(page, parent)).toBeVisible({ timeout: 30_000 });
    await openThread(parent);

    // The thread composer hides the toolbar but keeps the keyboard shortcuts.
    const threadInput = threadPanel(page).locator('cometchat-message-composer [contenteditable="true"]').first();
    const threadTag = `thread-bold-${uniqueTag()}`;
    await threadInput.click();
    await page.keyboard.type(threadTag);
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(threadInput.locator('strong, b')).toHaveText(threadTag);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    const threadBubble = threadPanel(page)
      .locator('cometchat-message-list .cometchat-message-list__message')
      .filter({ hasText: threadTag })
      .locator('.cometchat-text-bubble__text');
    await expect(threadBubble.locator('strong, b')).toHaveText(threadTag, { timeout: 30_000 });
  });

  test('thread parent message preview shows formatted content without raw markers', async () => {
    const tag = `thread-bold-parent-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });
    await openThread(tag);

    const header = threadPanel(page).locator('cometchat-thread-header');
    await expect(header.locator('strong, b').filter({ hasText: tag })).toBeVisible();
    await expect(header).not.toContainText('**');
  });
});

// ─── Format Combination Matrix ────────────────────────────────────────────────

test.describe('Rich Text — Format Combinations', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  // ✅ SHOULD WORK TOGETHER

  test('bold + italic combination applies both marks', async () => {
    await typeAndSelectAll(page, 'bold italic');
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.press('ControlOrMeta+i');
    const input = composerInput(page);
    await expect(input.locator('strong, b').filter({ hasText: 'bold italic' })).toBeVisible();
    await expect(input.locator('em, i').filter({ hasText: 'bold italic' })).toBeVisible();
    await clearInput(page);
  });

  test('bold + underline combination applies both marks', async () => {
    await typeAndSelectAll(page, 'bold underline');
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.press('ControlOrMeta+u');
    const input = composerInput(page);
    await expect(input.locator('strong, b').filter({ hasText: 'bold underline' })).toBeVisible();
    await expect(input.locator('u').filter({ hasText: 'bold underline' })).toBeVisible();
    await clearInput(page);
  });

  test('bold + italic + underline triple combination applies all three marks', async () => {
    await typeAndSelectAll(page, 'triple format');
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.press('ControlOrMeta+i');
    await page.keyboard.press('ControlOrMeta+u');
    const input = composerInput(page);
    await expect(input.locator('strong, b').filter({ hasText: 'triple format' })).toBeVisible();
    await expect(input.locator('em, i').filter({ hasText: 'triple format' })).toBeVisible();
    await expect(input.locator('u').filter({ hasText: 'triple format' })).toBeVisible();
    await clearInput(page);
  });

  test('bold inside a list item applies bold mark within <li>', async () => {
    await composerInput(page).click();
    await page.keyboard.type('list bold item');
    await toolbarButton(page, 'Bulleted list').click();
    await expect(composerInput(page).locator('ul > li')).toHaveText('list bold item');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('ul li').locator('strong, b')).toHaveText('list bold item');
    await clearInput(page);
  });

  test('italic inside blockquote applies italic mark within <blockquote>', async () => {
    // Known UI Kit defect (ENG-40829): with the caret in a typed line (no selection), Quote does not turn
    // that line into a quote, as Numbered/Bulleted list do; it appends an empty <blockquote>
    // after it and leaves the text outside ("quoted italic<blockquote>\u200b</blockquote>").
    // Code block behaves the same. Expected to fail until fixed.
    test.fail();
    await composerInput(page).click();
    await page.keyboard.type('quoted italic');
    await toolbarButton(page, 'Quote').click();
    await expect(composerInput(page).locator('blockquote')).toContainText('quoted italic');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(composerInput(page).locator('blockquote').locator('em, i')).toHaveText('quoted italic');
    await clearInput(page);
  });

  // ❌ SHOULD NOT WORK TOGETHER (mutually exclusive)

  test('inline code strips bold mark — code does not nest with bold', async () => {
    await typeAndSelectAll(page, 'code no bold');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText('code no bold');
    await toolbarButton(page, 'Inline code').click();
    const input = composerInput(page);
    await expect(input.locator('code')).toHaveText('code no bold');
    await expect(input.locator('code strong, code b')).toHaveCount(0);
    await clearInput(page);
  });

  test('code block strips inline marks — no bold/italic inside <pre>', async () => {
    await typeAndSelectAll(page, 'preformatted code');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText('preformatted code');
    await toolbarButton(page, 'Code block').click();
    const input = composerInput(page);
    await expect(input.locator('pre')).toContainText('preformatted code');
    await expect(input.locator('pre strong, pre b, pre em, pre i')).toHaveCount(0);
    await clearInput(page);
  });

  test('ordered list and unordered list are mutually exclusive', async () => {
    await composerInput(page).click();
    await page.keyboard.type('list item');
    await toolbarButton(page, 'Numbered list').click();
    await expect(composerInput(page).locator('ol > li')).toHaveText('list item');
    await toolbarButton(page, 'Bulleted list').click();
    // Switching to bullets replaces the numbered list rather than nesting the two.
    await expect(composerInput(page).locator('ul > li')).toHaveText('list item');
    await expect(composerInput(page).locator('ol')).toHaveCount(0);
    await clearInput(page);
  });

  test('toggling bold off removes the mark', async () => {
    await typeAndSelectAll(page, 'toggle bold');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText('toggle bold');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveCount(0);
    await expect(composerInput(page)).toHaveText('toggle bold');
    await clearInput(page);
  });

  test('toggling italic off removes the mark', async () => {
    await typeAndSelectAll(page, 'toggle italic');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(composerInput(page).locator('em, i')).toHaveText('toggle italic');
    await page.keyboard.press('ControlOrMeta+i');
    await expect(composerInput(page).locator('em, i')).toHaveCount(0);
    await expect(composerInput(page)).toHaveText('toggle italic');
    await clearInput(page);
  });
});

// ─── Mentions + Rich Text Combinations ───────────────────────────────────────

test.describe('Rich Text — Mentions Combined with Formatting', () => {
  let page: Page;
  let groupName: string;
  let mentionName: string;

  test.beforeAll(async () => {
    // A group of this run's own users, so the mention list holds people the run knows.
    const runId = uniqueTag();
    groupName = `E2E Rich Mentions ${runId}`;
    await createE2EGroup(`e2e-rich-mentions-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER, THIRD_USER]);
    mentionName = await getUserName(SECONDARY_USER);
  });

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await openConversation(page, groupName);
    // Let the list finish its first load (the group's "added" messages): a message sent while
    // it is still loading can be missing from the list once the load lands.
    await scrollToLatestMessage(page);
    await expect(composerInput(page)).toBeVisible();
  });

  /**
   * Type "@" and the secondary user's first name, and pick them from the suggestions with Enter once
   * they are the only (and so the highlighted) suggestion. Choosing by keyboard avoids clicking
   * a row the list is about to replace while it refreshes.
   */
  async function insertMention() {
    await composerInput(page).click();
    // Only the first word: a space ends the mention query. It is unique among the members.
    await page.keyboard.type(`@${mentionName.split(' ')[0]}`);
    const options = composer(page).getByRole('listbox').getByRole('option');
    await expect(options).toHaveCount(1, { timeout: 15_000 });
    await expect(options.first()).toContainText(mentionName);
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(composerInput(page).locator('.cometchat-mentions').filter({ hasText: mentionName })).toBeVisible();
  }

  test('mention followed by bold text — both render correctly', async () => {
    await insertMention();
    const boldSuffix = `boldaftermention${uniqueTag()}`;
    await page.keyboard.type(` ${boldSuffix}`);
    for (let i = 0; i < boldSuffix.length; i++) await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('ControlOrMeta+b');

    const input = composerInput(page);
    await expect(input.locator('.cometchat-mentions').filter({ hasText: mentionName })).toBeVisible();
    await expect(input.locator('strong, b')).toHaveText(boldSuffix);
    await clearInput(page);
  });

  test('mention inside italic text — mention chip renders within italic span', async () => {
    // Known UI Kit defect (ENG-40830): typing "@" inside formatted text (italic or bold) opens no mention
    // suggestions — "check @Bob" offers Bob in plain text, but nothing once "check " is italic
    // (editor holds <i>check @Bob</i>, no listbox). Expected to fail until fixed.
    test.fail();
    await composerInput(page).click();
    await page.keyboard.press('ControlOrMeta+i');
    await page.keyboard.type('check ');
    await expect(composerInput(page).locator('em, i')).toHaveText(/^check\s$/);
    await insertMention();

    const input = composerInput(page);
    await expect(input.locator('em, i').filter({ hasText: 'check' })).toBeVisible();
    await expect(input.locator('em .cometchat-mentions, i .cometchat-mentions')).toContainText(mentionName);
    await clearInput(page);
  });

  test('sending message with mention + bold renders both in text bubble @quarantine (ENG-40626)', async () => {
    // @quarantine (ENG-40626): intermittent UI Kit defect — the selection made right after
    // inserting a mention and typing is sometimes lost to the composer's deferred passes, so
    // Ctrl+B bolds only the last character. Failed 1 of 7 runs, so it can't be test.fail.
    await insertMention();
    const suffix = `mentionbold${uniqueTag()}`;
    await page.keyboard.type(` ${suffix}`);
    for (let i = 0; i < suffix.length; i++) await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText(suffix);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    const bubble = bubbleText(page, suffix);
    await expect(bubble.locator('.cometchat-mentions')).toContainText(mentionName, { timeout: 30_000 });
    await expect(bubble.locator('strong, b')).toHaveText(suffix);
  });

  test('@mention in an ordered list item renders correctly', async () => {
    await composerInput(page).click();
    await toolbarButton(page, 'Numbered list').click();
    await expect(composerInput(page).locator('ol > li')).toHaveCount(1);
    await insertMention();

    await expect(composerInput(page).locator('ol > li .cometchat-mentions')).toContainText(mentionName);
    await clearInput(page);
  });
});

// ─── Link Insertion ───────────────────────────────────────────────────────────

test.describe('Rich Text — Link Insertion', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  const linkDialog = () => page.locator('cometchat-link-dialog');

  /** Select all typed text, open the link dialog, enter `url` and save. */
  async function linkSelection(url: string) {
    await page.keyboard.press('ControlOrMeta+a');
    await toolbarButton(page, 'Link').click();
    await expect(linkDialog().getByRole('dialog')).toBeVisible();
    await linkDialog().getByRole('textbox', { name: 'Link' }).fill(url);
    await linkDialog().getByRole('button', { name: 'Save' }).click();
    await expect(linkDialog()).toHaveCount(0);
  }

  test('link button is present in toolbar', async () => {
    await expect(toolbarButton(page, 'Link')).toBeVisible();
  });

  test('link button opens URL input dialog or inline input', async () => {
    await composerInput(page).click();
    await page.keyboard.type('click here');
    await page.keyboard.press('ControlOrMeta+a');
    await toolbarButton(page, 'Link').click();

    // The dialog offers the selected text and a URL field.
    await expect(linkDialog().getByRole('dialog')).toBeVisible();
    await expect(linkDialog().getByRole('textbox', { name: 'Text' })).toHaveValue('click here');
    await linkDialog().getByRole('textbox', { name: 'Link' }).fill('https://cometchat.com');
    await linkDialog().getByRole('button', { name: 'Save' }).click();

    await expect(composerInput(page).locator('a[href^="https://cometchat.com"]')).toHaveText('click here');
    await clearInput(page);
  });

  test('link renders as <a> tag in text bubble after send', async () => {
    const linkText = `link-test-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(linkText);
    await linkSelection('https://cometchat.com');
    await expect(composerInput(page).locator('a')).toHaveText(linkText);
    await clickSend(page);

    await expect(bubbleText(page, linkText).locator('a[href^="https://cometchat.com"]')).toHaveText(linkText, {
      timeout: 30_000,
    });
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

test.describe('Rich Text — Accessibility', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('all toolbar buttons have aria-label or title attributes', async () => {
    const buttons = toolbar(page).getByRole('button');
    await expect(buttons).toHaveCount(10);
    const labels = await buttons.evaluateAll((els) =>
      els.map((el) => (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim())
    );
    expect(labels.filter((l) => !l)).toEqual([]);
  });

  test('active format button has aria-pressed="true"', async () => {
    await typeAndSelectAll(page, 'test');
    await expect(toolbarButton(page, 'Bold')).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(composerInput(page).locator('strong, b')).toHaveText('test');
    await expect(toolbarButton(page, 'Bold')).toHaveAttribute('aria-pressed', 'true');
    await clearInput(page);
  });

  test('toolbar buttons are keyboard focusable via Tab', async () => {
    const bold = toolbarButton(page, 'Bold');
    await bold.focus();
    await expect(bold).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(toolbarButton(page, 'Italic')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(toolbarButton(page, 'Underline')).toBeFocused();
  });

  test('formatted text bubble has readable text content for screen readers', async () => {
    const boldTag = `a11y-bold-${uniqueTag()}`;
    await sendFormattedMessage(page, boldTag, { shortcut: 'ControlOrMeta+b' });
    // The accessible text is exactly the message: no markdown markers read out.
    await expect(bubbleText(page, boldTag)).toHaveText(boldTag);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

test.describe('Rich Text — Edge Cases', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await openSecondaryChat(page);
  });

  test('empty composer cannot be sent with formatting applied', async () => {
    const rows = page.locator('cometchat-messages .cometchat-message-list__message');
    const before = await rows.count();
    await composerInput(page).click();
    await page.keyboard.press('ControlOrMeta+b');

    await expect(composer(page).getByRole('button', { name: 'Send message' })).toBeDisabled();
    await page.keyboard.press('Enter');
    await expect(rows).toHaveCount(before);
  });

  test('formatting clears after message is sent', async () => {
    const tag = `clear-after-send-${uniqueTag()}`;
    await sendFormattedMessage(page, tag, { shortcut: 'ControlOrMeta+b' });

    await expect(composerInput(page)).toHaveText('');
    await expect(composerInput(page).locator('strong, b')).toHaveCount(0);
    await expect(toolbarButton(page, 'Bold')).toHaveAttribute('aria-pressed', 'false');
  });

  test('very long formatted message sends and renders without truncation in bubble', async () => {
    const longText = `long-${'x'.repeat(200)}-${uniqueTag()}`;
    await typeAndSelectAll(page, longText);
    await page.keyboard.press('ControlOrMeta+b');
    await clickSend(page);

    // Long text may collapse behind "Read more", but the whole message stays in the bubble.
    const bubble = bubbleText(page, longText.slice(0, 30));
    await expect(bubble.locator('strong, b')).toHaveText(longText, { timeout: 30_000 });
  });

  test('multi-line content with Shift+Enter preserves line breaks in bubble', async () => {
    const line1 = `line1-${uniqueTag()}`;
    const line2 = `line2-${uniqueTag()}`;
    await composerInput(page).click();
    await page.keyboard.type(line1);
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type(line2);
    await page.keyboard.press('Enter');

    const bubble = bubbleText(page, line1);
    await expect(bubble).toContainText(line2, { timeout: 30_000 });
    // innerText reflects rendered line breaks: the two lines are not run together.
    expect(await bubble.innerText()).toMatch(new RegExp(`${line1}\\s*\\n\\s*${line2}`));
  });

  test('pasting plain text into formatted composer preserves existing format', async () => {
    const input = composerInput(page);
    await input.click();
    await page.keyboard.type('start ');
    await page.keyboard.press('ControlOrMeta+b');
    await page.keyboard.type('bold part');
    await expect(input.locator('strong, b')).toHaveText('bold part');

    // Paste plain text at the end, as a clipboard paste would deliver it.
    await input.evaluate((el) => {
      const data = new DataTransfer();
      data.setData('text/plain', ' pasted');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    });

    await expect(input).toContainText('start bold part pasted');
    await expect(input.locator('strong, b').first()).toContainText('bold part');
    await clearInput(page);
  });
});
