import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  conversationRow,
  openConversation,
  getUserName,
  sendTextAs,
  sendCustomAs,
  sendMessageAs,
  createE2EGroup,
  SECONDARY_USER,
  deleteMessageAs,
  addGroupMembers,
  removeGroupMember,
  PRIMARY_USER,
  E2E_USER_UIDS,
  getE2EUserName,
  E2E_GROUP_GUIDS,
  E2E_GROUP_NAMES,
  uniqueTag,
} from '../helpers';

/**
 * Conversations list behaviour: last-message previews, unread badge, row actions,
 * pagination and the error state.
 *
 * Arrangement happens over REST before the page loads, so each test asserts on
 * what the list renders for known data. Every assertion waits on UI state.
 */

/** Seeded E2E user N (1-based) and the display name the seed gives it. */
const e2eUser = (n: number) => ({
  uid: E2E_USER_UIDS[n - 1],
  name: getE2EUserName(n - 1),
});

test.beforeAll(async () => {
  // One conversation per seeded E2E user, so the primary user has more than one
  // page (30) of conversations.
  // Each send waits for moderation, which can be slow under load.
  test.setTimeout(180_000);
  for (let i = 0; i < E2E_USER_UIDS.length; i += 5) {
    await Promise.all(
      E2E_USER_UIDS.slice(i, i + 5).map((uid) => sendTextAs(uid, PRIMARY_USER, `Hello from ${uid}`))
    );
  }
});

/** The row's "More options" button only renders while the row is hovered. */
async function openRowMenu(page: Page, name: string) {
  const row = conversationRow(page, name);
  await row.hover();
  await row.getByRole('button', { name: 'More options' }).click();
}

// ─── List and rows ───────────────────────────────────────────────────────────

test.describe('List and rows', () => {
  test('the list has a "Chats" title and an accessible name', async ({ page }) => {
    await loginToApp(page);
    const list = page.locator('.cometchat-conversations');
    await expect(list.locator('.cometchat-conversations__title')).toHaveText(/^\s*Chats\s*$/, { timeout: 30_000 });
    await expect(list).toHaveAttribute('aria-label', 'Conversations list');
  });

  test('a row shows avatar, name, last message and time, and is an option named after the conversation @smoke', async ({
    page,
  }) => {
    const name = await getUserName(SECONDARY_USER);
    const text = `Row ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await loginToApp(page);

    const row = conversationRow(page, name);
    await expect(row.locator('.cometchat-conversation-item__subtitle')).toContainText(text, { timeout: 30_000 });
    await expect(row.locator('.cometchat-conversation-item__avatar')).toBeVisible();
    await expect(row.locator('.cometchat-conversation-item__date')).toBeVisible();
    await expect(row).toHaveAttribute('role', 'option');
    await expect(row).toHaveAttribute('aria-label', new RegExp(name));
  });

  test('opening a conversation highlights its row as active @smoke', async ({ page }) => {
    const name = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    await openConversation(page, name);
    await expect(
      page.locator('.cometchat-conversations__list-item--active .cometchat-conversation-item__title-text')
    ).toHaveText(new RegExp(`^\\s*${name}\\s*$`));
  });
});

// ─── Last-message preview ────────────────────────────────────────────────────

test.describe('Last-message preview', () => {
  // Safe to run in parallel: each test sends from its own seeded user and only asserts on
  // that user's row. Run with --workers=N to use it (the config default is 1 worker).
  test.describe.configure({ mode: 'parallel' });

  test('a sticker shows "Sticker"', async ({ page }) => {
    const sender = e2eUser(21);
    await sendCustomAs(sender.uid, PRIMARY_USER, 'extension_sticker', {
      sticker_url: 'https://assets.cometchat.io/sampleapp/v2/stickers/1.png',
      sticker_name: 'e2e',
    });

    await loginToApp(page);

    await expect(conversationRow(page, sender.name)).toContainText('Sticker', { timeout: 30_000 });
  });

  test('a poll shows "Poll"', async ({ page }) => {
    const sender = e2eUser(22);
    await sendCustomAs(sender.uid, PRIMARY_USER, 'extension_poll', {
      question: 'E2E poll?',
      options: { '1': 'Yes', '2': 'No' },
    });

    await loginToApp(page);

    await expect(conversationRow(page, sender.name)).toContainText('Poll', { timeout: 30_000 });
  });

  test('a deleted last message shows "Message is deleted"', async ({ page }) => {
    const sender = e2eUser(23);
    const id = await sendTextAs(sender.uid, PRIMARY_USER, 'This will be deleted');
    await deleteMessageAs(sender.uid, id);

    await loginToApp(page);

    await expect(conversationRow(page, sender.name)).toContainText('Message is deleted', { timeout: 30_000 });
  });

  test('a mention shows the mentioned name, not the raw mention markup', async ({ page }) => {
    const sender = e2eUser(24);
    const primaryName = await getUserName(PRIMARY_USER);
    await sendTextAs(sender.uid, PRIMARY_USER, `<@uid:${PRIMARY_USER}> are you there?`);

    await loginToApp(page);

    const row = conversationRow(page, sender.name);
    await expect(row).toContainText(`@${primaryName}`, { timeout: 30_000 });
    await expect(row).not.toContainText('<@uid:');
  });

  test('a group action shows the action, e.g. "added"', async ({ page }) => {
    // Remove first so the add always produces a fresh action message at the top.
    await removeGroupMember(E2E_GROUP_GUIDS.public, PRIMARY_USER);
    await addGroupMembers(E2E_GROUP_GUIDS.public, [PRIMARY_USER]);

    await loginToApp(page);

    await expect(conversationRow(page, E2E_GROUP_NAMES.public)).toContainText('added', { timeout: 30_000 });
  });

  // ── Media and other message types ──
  // Each case is sent by its own seeded user so it is that conversation's last message.

  const FILES = {
    image: { url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp', extension: 'webp', mimeType: 'image/webp' },
    video: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', extension: 'mp4', mimeType: 'video/mp4' },
    audio: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', extension: 'mp3', mimeType: 'audio/mpeg' },
    pdf: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', extension: 'pdf', mimeType: 'application/pdf' },
    docx: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    txt: { url: 'https://www.w3.org/TR/PNG/iso_8859-1.txt', extension: 'txt', mimeType: 'text/plain' },
  };
  type FileKind = keyof typeof FILES;

  /** Send one media message (image/video/audio/file) carrying `kinds` as its attachments. */
  const sendMedia = (
    senderN: number,
    type: 'image' | 'video' | 'audio' | 'file',
    kinds: FileKind[],
    extra: { caption?: string; metadata?: object } = {}
  ) =>
    sendMessageAs(e2eUser(senderN).uid, PRIMARY_USER, {
      category: 'message',
      type,
      data: {
        attachments: kinds.map((k, i) => ({ ...FILES[k], name: `e2e-${i + 1}.${FILES[k].extension}`, size: 1024 })),
        ...(extra.caption ? { text: extra.caption } : {}),
        ...(extra.metadata ? { metadata: extra.metadata } : {}),
      },
    });

  const MEDIA_CASES: { name: string; send: (n: number) => Promise<string>; preview: string }[] = [
    { name: 'an image', send: (n) => sendMedia(n, 'image', ['image']), preview: 'Image' },
    { name: 'an image with a caption', send: (n) => sendMedia(n, 'image', ['image'], { caption: 'nice trip' }), preview: 'Image · nice trip' },
    { name: 'three images', send: (n) => sendMedia(n, 'image', ['image', 'image', 'image']), preview: '3 Images' },
    { name: 'a video', send: (n) => sendMedia(n, 'video', ['video']), preview: 'Video' },
    { name: 'two videos', send: (n) => sendMedia(n, 'video', ['video', 'video']), preview: '2 Videos' },
    { name: 'an audio file', send: (n) => sendMedia(n, 'audio', ['audio']), preview: 'Audio' },
    { name: 'two audio files', send: (n) => sendMedia(n, 'audio', ['audio', 'audio']), preview: '2 Audio Files' },
    { name: 'a voice note', send: (n) => sendMedia(n, 'audio', ['audio'], { metadata: { audioType: 'voice_note' } }), preview: 'Voice Note' },
    { name: 'a PDF', send: (n) => sendMedia(n, 'file', ['pdf']), preview: 'File' },
    { name: 'a Word document', send: (n) => sendMedia(n, 'file', ['docx']), preview: 'File' },
    { name: 'three mixed documents', send: (n) => sendMedia(n, 'file', ['pdf', 'docx', 'txt']), preview: '3 Files' },
    { name: 'a file with a caption', send: (n) => sendMedia(n, 'file', ['pdf'], { caption: 'the report' }), preview: 'File · the report' },
  ];

  MEDIA_CASES.forEach((c, i) => {
    test(`${c.name} shows "${c.preview}"`, async ({ page }) => {
      const sender = e2eUser(i + 1);
      await c.send(i + 1);

      await loginToApp(page);

      await expect(conversationRow(page, sender.name)).toContainText(c.preview, { timeout: 30_000 });
    });
  });

  test('a link shows the URL', async ({ page }) => {
    const sender = e2eUser(13);
    const url = `https://www.cometchat.com/docs?preview=${uniqueTag()}`;
    await sendTextAs(sender.uid, PRIMARY_USER, url);

    await loginToApp(page);

    await expect(conversationRow(page, sender.name)).toContainText(url, { timeout: 30_000 });
  });

  for (const [n, type, extension, data, preview] of [
    [14, 'extension_document', 'document', { document_url: 'https://www.cometchat.com/e2e-doc' }, 'Collaborative Document'],
    [15, 'extension_whiteboard', 'whiteboard', { board_url: 'https://www.cometchat.com/e2e-board' }, 'Collaborative Whiteboard'],
  ] as const) {
    test(`a ${extension} shows "${preview}"`, async ({ page }) => {
      const sender = e2eUser(n);
      await sendMessageAs(sender.uid, PRIMARY_USER, {
        category: 'custom',
        type,
        data: { customData: data, metadata: { '@injected': { extensions: { [extension]: data } } } },
      });

      await loginToApp(page);

      await expect(conversationRow(page, sender.name)).toContainText(preview, { timeout: 30_000 });
    });
  }

  test('a card shows its text, falling back to "Card Message"', async ({ page }) => {
    const sender = e2eUser(16);
    await sendMessageAs(sender.uid, PRIMARY_USER, {
      category: 'card',
      type: 'card',
      data: { card: { fallbackText: 'E2E card', version: '1.0', body: [{ type: 'text', id: 'e2e-t', content: 'E2E card body' }] } },
    });

    await loginToApp(page);

    await expect(conversationRow(page, sender.name)).toContainText(/E2E card|Card Message/, { timeout: 30_000 });
  });

  test('formatted text shows the words without markdown markers', async ({ page }) => {
    const sender = e2eUser(17);
    await sendTextAs(sender.uid, PRIMARY_USER, '**Bold news** and _italic_ and ~~old~~');

    await loginToApp(page);

    const row = conversationRow(page, sender.name);
    await expect(row).toContainText('Bold news', { timeout: 30_000 });
    for (const marker of ['**', '~~', '_italic_']) await expect(row).not.toContainText(marker);
  });

  test('in a 1:1 chat, your own last message shows a receipt tick and no "You:" prefix', async ({ page }) => {
    const peer = e2eUser(18);
    const text = `Sent by me ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, peer.uid, text);

    await loginToApp(page);

    const row = conversationRow(page, peer.name);
    await expect(row).toContainText(text, { timeout: 30_000 });
    await expect(row.locator('.cometchat-conversation-item__receipt')).toBeVisible();
    await expect(row).not.toContainText('You:');
  });

  test('in a group, your own last message is prefixed "You:"', async ({ page }) => {
    const runId = uniqueTag();
    const groupName = `E2E Preview Mine ${runId}`;
    const guid = `e2e-preview-mine-${runId}`;
    await createE2EGroup(guid, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    const text = `From me ${uniqueTag()}`;
    await sendMessageAs(PRIMARY_USER, guid, { category: 'message', type: 'text', data: { text } }, 'group');

    await loginToApp(page);

    const row = conversationRow(page, groupName);
    await expect(row).toContainText(text, { timeout: 30_000 });
    await expect(row).toContainText('You:');
  });

  test("in a group, the last message shows who sent it", async ({ page }) => {
    const runId = uniqueTag();
    const groupName = `E2E Preview ${runId}`;
    const guid = `e2e-preview-${runId}`;
    await createE2EGroup(guid, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    const text = `From George ${uniqueTag()}`;
    await sendMessageAs(SECONDARY_USER, guid, { category: 'message', type: 'text', data: { text } }, 'group');
    const secondaryName = await getUserName(SECONDARY_USER);

    await loginToApp(page);

    const row = conversationRow(page, groupName);
    await expect(row).toContainText(text, { timeout: 30_000 });
    await expect(row).toContainText(`${secondaryName}:`);
  });
});

// ─── Unread ──────────────────────────────────────────────────────────────────

test.describe('Unread', () => {
  test('a new message shows a badge, and opening the conversation clears it @smoke', async ({ page }) => {
    const sender = e2eUser(27);
    await sendTextAs(sender.uid, PRIMARY_USER, `Unread check [${uniqueTag()}]`);
    await loginToApp(page);
    const badge = conversationRow(page, sender.name).locator('.cometchat-conversation-item__badge');
    await expect(badge).toBeVisible({ timeout: 30_000 });

    await openConversation(page, sender.name);

    await expect(badge).toBeHidden({ timeout: 30_000 });
  });
});

// ─── Row actions ─────────────────────────────────────────────────────────────

test.describe('Row actions', () => {
  test('delete asks first: Cancel keeps the conversation, Delete removes it for good', async ({ page }) => {
    const target = e2eUser(28);
    await loginToApp(page);
    const row = conversationRow(page, target.name);
    await expect(row).toBeVisible({ timeout: 30_000 });
    // The overlay and the confirm dialog inside it both carry role="dialog".
    const dialog = page.locator('.cometchat-conversations__dialog-overlay');

    await openRowMenu(page, target.name);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(dialog).toContainText('Delete Conversation?');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toBeVisible();

    await openRowMenu(page, target.name);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);

    await page.reload();
    await expect(conversationRow(page, e2eUser(30).name)).toBeVisible({ timeout: 30_000 });
    await expect(row).toHaveCount(0);
  });

  test('pin moves the conversation to the top and marks it; unpin asks first and removes the mark', async ({
    page,
  }) => {
    const target = e2eUser(29);
    await loginToApp(page);
    const row = conversationRow(page, target.name);
    await expect(row).toBeVisible({ timeout: 30_000 });
    const pinMark = row.locator('.cometchat-conversation-item__pin');
    const unpinDialog = page.locator('cometchat-pin-save-confirm-dialog');

    const unpin = async () => {
      await openRowMenu(page, target.name);
      await page.getByRole('menuitem', { name: 'Unpin conversation' }).click();
      await expect(unpinDialog).toContainText('Do you want to unpin this conversation?');
      await unpinDialog.getByRole('button', { name: 'Unpin' }).click();
      await expect(unpinDialog).toBeHidden();
      await expect(pinMark).toBeHidden({ timeout: 30_000 });
    };
    // A pin left behind by an earlier interrupted run would make the menu offer Unpin.
    if (await pinMark.isVisible()) await unpin();

    await openRowMenu(page, target.name);
    const pin = page.getByRole('menuitem', { name: 'Pin conversation' });
    // Delete is always offered, so once it renders the menu is complete.
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(pin).toBeVisible();
    await pin.click();

    await expect(page.locator('.cometchat-conversation-item').first()).toContainText(target.name, {
      timeout: 30_000,
    });
    await expect(pinMark).toBeVisible();

    await unpin();
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────

test.describe('Pagination', () => {
  test('a list of 30 or more conversations scrolls to its last row', async ({ page }) => {
    await loginToApp(page);
    const rows = page.locator('.cometchat-conversation-item');
    await expect(rows).toHaveCount(30, { timeout: 30_000 });
    const list = page.locator('cometchat-conversations .cometchat-paginated-list');

    const overflows = await list.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(overflows, 'the list should overflow and be scrollable').toBe(true);
    await expect(rows.first()).toBeInViewport();
    await expect(rows.last()).not.toBeInViewport();

    await rows.first().hover();
    await expect(async () => {
      await page.mouse.wheel(0, 1_500);
      await expect(rows.last()).toBeInViewport({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await expect(rows.first()).not.toBeInViewport();
  });

  test('scrolling past the first page loads more conversations without duplicates @quarantine (ENG-40796)', async ({ page }) => {
    // @quarantine (ENG-40796): intermittent UI Kit defect. Scrolling to the end of the Chats list
    // sometimes never requests the next page, so it stays at 30 rows: it passed in two CI runs
    // and failed both attempts in the next.
    await loginToApp(page);
    const rows = page.locator('.cometchat-conversation-item');
    await expect(rows).toHaveCount(30, { timeout: 30_000 });

    await expect(async () => {
      await rows.last().hover();
      await page.mouse.wheel(0, 2_000);
      expect(await rows.count()).toBeGreaterThan(30);
    }).toPass({ timeout: 30_000 });

    const titles = await page.locator('.cometchat-conversation-item__title-text').allTextContents();
    const names = titles.map((t) => t.trim());
    expect(new Set(names).size).toBe(names.length);
  });
});

// ─── Error state ─────────────────────────────────────────────────────────────

test.describe('Error state', () => {
  test('a failed load shows the error view, and Retry loads the list', async ({ page }) => {
    let failNext = true;
    await page.route(/\/conversations(\?|$)/, async (route) => {
      if (failNext && route.request().method() === 'GET') {
        failNext = false;
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'ERR_E2E_FORCED', message: 'Forced failure' } }),
        });
      }
      return route.continue();
    });

    await loginToApp(page);

    await expect(page.locator('.cometchat-conversations__error-title')).toHaveText('OOPS!', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('.cometchat-conversations__error-title')).toBeHidden({ timeout: 30_000 });
    await expect(conversationRow(page, e2eUser(30).name)).toBeVisible({ timeout: 30_000 });
  });
});
