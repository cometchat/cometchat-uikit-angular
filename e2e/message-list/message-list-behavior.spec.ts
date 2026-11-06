import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  conversationRow,
  openConversation,
  scrollToLatestMessage,
  scrollMessageListToTop,
  getUserName,
  createE2EUser,
  sendTextAs,
  sendCustomAs,
  sendMessageAs,
  editTextAs,
  deleteMessageAs,
  addGroupMembers,
  removeGroupMember,
  PRIMARY_USER,
  SECONDARY_USER,
  E2E_GROUP_GUIDS,
  E2E_GROUP_NAMES,
  uniqueTag,
} from '../helpers';

/**
 * Message list behaviour: scroll position, the new-message indicator, action
 * bubbles, jumping to a quoted message, an empty conversation and a failed send.
 *
 * Global setup seeds 50+ messages between the primary and secondary users, which
 * gives the 1:1 conversation more than one page. Every assertion waits on UI state.
 */

// Record failed CometChat API responses during each test and attach them to the report
// when the test fails, so a backend or network error is visible instead of guessed at.
const failedApiCalls = new WeakMap<Page, string[]>();
/** CometChat REST/WebSocket hosts only (not static assets such as avatar images). */
const isCometChatApi = (url: string) => /\.api(client)?-[a-z]+\.cometchat\.io|websocket/.test(url);
test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  failedApiCalls.set(page, failures);
  page.on('response', (r) => {
    if (isCometChatApi(r.url()) && r.status() >= 400) {
      failures.push(`${r.status()} ${r.request().method()} ${r.url().split('?')[0]}`);
    }
  });
  page.on('requestfailed', (r) => {
    if (isCometChatApi(r.url())) {
      failures.push(`FAILED (${r.failure()?.errorText}) ${r.method()} ${r.url().split('?')[0]}`);
    }
  });
});
test.afterEach(async ({ page }, testInfo) => {
  const failures = failedApiCalls.get(page) ?? [];
  if (testInfo.status !== testInfo.expectedStatus && failures.length) {
    await testInfo.attach('failed-api-calls', { body: failures.join('\n'), contentType: 'text/plain' });
  }
});

// The list row and the bubble inside it both carry data-message-id; target the row.
const bubble = (page: Page, messageId: string) =>
  page.locator(`.cometchat-message-list__message[data-message-id="${messageId}"]`);

/** Scroll the open message list up by mouse wheel until `done` holds. */
async function scrollUpUntil(page: Page, done: () => Promise<void>): Promise<void> {
  await page.locator('cometchat-message-list .cometchat-message-bubble').last().hover();
  await expect(async () => {
    await page.mouse.wheel(0, -1_500);
    await done();
  }).toPass({ timeout: 30_000 });
}

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  const secondaryName = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  const list = await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  return list;
}

async function sendFromComposer(page: Page, text: string): Promise<void> {
  const input = page.locator('cometchat-message-composer [contenteditable="true"]').first();
  await input.click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

// ─── Scrolling ───────────────────────────────────────────────────────────────

test.describe('Scrolling', () => {
  test('loading older messages keeps the reading position', async ({ page }) => {
    // Opening the chat can already load two pages (30 each) around the unread divider, and the
    // seeded chat has only about 50 messages; add more so there is always an older page left.
    test.setTimeout(120_000);
    const runId = uniqueTag();
    for (let batch = 0; batch < 5; batch++) {
      await Promise.all(
        // Sent by the primary user, so they don't leave unread messages that change how the
        // chat opens for later tests.
        Array.from({ length: 8 }, (_, i) => sendTextAs(PRIMARY_USER, SECONDARY_USER, `History filler ${batch * 8 + i + 1} [${runId}]`))
      );
    }
    const secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    const list = await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);
    const messages = list.locator('.cometchat-message-list__message[data-message-id]');
    const firstLoadedId = (await messages.first().getAttribute('data-message-id'))!;
    const loadedBefore = await messages.count();

    await scrollMessageListToTop(page);
    await expect.poll(() => messages.count(), { timeout: 30_000 }).toBeGreaterThan(loadedBefore);

    // The message that was oldest before the load is still in view, not jumped away.
    await expect(bubble(page, firstLoadedId)).toBeInViewport();
  });

  test('a message arriving while scrolled up raises a badge instead of jumping', async ({ page }) => {
    const secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    const list = await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);
    const scrollToBottom = page.locator('.cometchat-message-list__scroll-to-bottom');
    await scrollUpUntil(page, async () => {
      await expect(scrollToBottom).toBeVisible({ timeout: 1_000 });
    });

    const text = `Arrived while scrolled up [${uniqueTag()}]`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);

    // Separate "the message never reached the app" (realtime delivery) from "it arrived but
    // no badge appeared" (message list), so a failure says which one broke.
    await expect(
      conversationRow(page, secondaryName),
      'the incoming message reached the app: the Chats list preview updated'
    ).toContainText(text, { timeout: 30_000 });
    await expect(
      scrollToBottom.locator('.cometchat-message-list__unread-badge'),
      'the scroll-to-bottom button shows an unread badge of 1'
    ).toHaveText('1', { timeout: 10_000 });
    await scrollToBottom.locator('cometchat-button').click();
    await expect(list.getByText(text)).toBeInViewport({ timeout: 30_000 });
    await expect(scrollToBottom).toBeHidden();
  });

  test('sending a message while scrolled up scrolls down to it @quarantine (ENG-40820)', async ({ page }) => {
    // @quarantine (ENG-40820): intermittent UI Kit defect — when the chat is scrolled up, your own sent
    // message is sometimes added off screen and the list stays where it was. It failed in 1 of
    // 3 isolated runs (so test.fail() reported "expected to fail, but passed" in the others).
    const secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    const list = await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);
    const scrollToBottom = page.locator('.cometchat-message-list__scroll-to-bottom');
    await scrollUpUntil(page, async () => {
      await expect(scrollToBottom).toBeVisible({ timeout: 1_000 });
    });

    const text = `Sent while scrolled up [${uniqueTag()}]`;
    await page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first().click();
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');

    await expect(list.getByText(text)).toBeInViewport({ timeout: 10_000 });
  });
});

// ─── Bubbles ─────────────────────────────────────────────────────────────────

test.describe('Bubbles', () => {
  test('adding a member shows an action bubble in the group', async ({ page }) => {
    const primaryName = await getUserName(PRIMARY_USER);
    // Remove first so the add always produces a fresh action message.
    await removeGroupMember(E2E_GROUP_GUIDS.public, PRIMARY_USER);
    await addGroupMembers(E2E_GROUP_GUIDS.public, [PRIMARY_USER]);
    await loginToApp(page);

    const list = await openConversation(page, E2E_GROUP_NAMES.public);

    const lastAction = list.locator('cometchat-action-bubble').last();
    await expect(lastAction).toContainText('added', { timeout: 30_000 });
    await expect(lastAction).toContainText(primaryName);
  });
});

// ─── Jump to message ─────────────────────────────────────────────────────────

test.describe('Jump to message', () => {
  test('clicking a quoted message scrolls to and highlights the original @quarantine (ENG-40734)', async ({ page }) => {
    // @quarantine (ENG-40734): intermittent UI Kit defect. In CI, clicking the reply's quoted
    // preview sometimes leaves the original (loaded in the list) off screen and unhighlighted;
    // it passed in another CI run and locally, so it can't be test.fail.
    const secondaryName = await getUserName(SECONDARY_USER);
    const runId = uniqueTag();
    const originalId = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Original to quote [${runId}]`);
    // The fillers only need to sit between the original and the reply, in any order; sending
    // them together keeps the setup (each send waits for moderation) inside the test's time.
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => sendTextAs(SECONDARY_USER, PRIMARY_USER, `Filler ${i + 1} [${runId}]`))
    );
    const replyId = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Reply to the original [${runId}]`, originalId);
    await loginToApp(page);
    await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);
    await expect(bubble(page, replyId)).toBeInViewport({ timeout: 30_000 });
    await expect(bubble(page, originalId)).not.toBeInViewport();

    await bubble(page, replyId).locator('.cometchat-message-bubble__body-reply-view').click();

    await expect(bubble(page, originalId)).toBeInViewport({ timeout: 10_000 });
    await expect(bubble(page, originalId)).toHaveClass(/cometchat-message-list__message--highlighted/);
  });
});

// ─── Empty conversation ──────────────────────────────────────────────────────

test.describe('Empty conversation', () => {
  /** Create a user with no history and open a chat with them from the Users tab. */
  /**
   * Create a user with no history and open a chat with them from the Users tab.
   * With `holdFirstLoad`, the chat's first message fetch is held until `releaseFirstLoad()`
   * is called, so a test can act deterministically while the chat is still loading.
   */
  async function openNewChat(page: Page, { holdFirstLoad = false } = {}) {
    const runId = uniqueTag();
    const peer = { uid: `e2e-empty-${runId}`, name: `E2E Empty ${runId}` };
    await createE2EUser(peer.uid, peer.name);
    let releaseFirstLoad = () => {};
    const released = new Promise<void>((resolve) => (releaseFirstLoad = resolve));
    const isFirstLoad = (url: URL) => url.pathname.includes(`/users/${peer.uid}/messages`);
    if (holdFirstLoad) {
      await page.route(isFirstLoad, async (route) => {
        await released;
        await route.continue();
      });
    }
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
    const users = page.locator('cometchat-users');
    // Search typed before the user list first renders is ignored (UI Kit defect: no search
    // request is ever sent), so wait for the list first.
    await expect(users.locator('cometchat-user-item, .cometchat-list-item').first()).toBeVisible({ timeout: 30_000 });
    // A user created seconds ago can take a moment to appear in search results.
    await expect(async () => {
      await users.getByRole('searchbox').fill(peer.name);
      await expect(users.getByText(peer.name)).toBeVisible({ timeout: 8_000 });
    }).toPass({ timeout: 40_000 });
    const firstLoad = page.waitForResponse(
      (r) => r.request().method() === 'GET' && isFirstLoad(new URL(r.url())),
      { timeout: 30_000 }
    );
    await users.getByText(peer.name).click();
    await expect(page.locator('cometchat-message-list')).toBeVisible({ timeout: 30_000 });
    if (!holdFirstLoad) await firstLoad;
    return { peer, runId, releaseFirstLoad, firstLoad };
  }

  test('a new chat has no messages, and the first message sent appears and lists the chat @smoke', async ({
    page,
  }) => {
    const { peer, runId } = await openNewChat(page);
    const list = page.locator('cometchat-message-list');
    await expect(page.locator('cometchat-message-header')).toContainText(peer.name);
    await expect(list.locator('.cometchat-message-list__message[data-message-id]')).toHaveCount(0);

    const text = `First message [${runId}]`;
    await sendFromComposer(page, text);
    await expect(list.getByText(text)).toBeVisible({ timeout: 30_000 });
    await expect(list.locator('.cometchat-message-list__message[data-message-id]')).toHaveCount(1);

    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Chats' }).click();
    await expect(conversationRow(page, peer.name)).toContainText(text, { timeout: 30_000 });
  });

  test('a message sent before a new chat finishes loading still appears', async ({ page }) => {
    // ENG-39944: a message sent while the chat's first load is running used to vanish, because
    // the SDK clears the in-flight message's receiver ID and the queued event was then dropped
    // as "not for this conversation". The send is held until the load has finished, so the
    // race happens every run.
    const { runId, releaseFirstLoad, firstLoad } = await openNewChat(page, { holdFirstLoad: true });

    const text = `Sent during load [${runId}]`;
    // Hold the send until the first load has completed, so the message is added while the chat
    // is loading and confirmed only after the loaded page has replaced the list.
    let firstLoadDone = () => {};
    const loaded = new Promise<void>((resolve) => (firstLoadDone = resolve));
    await page.route(
      (url) => url.pathname.endsWith('/messages'),
      async (route) => {
        if (route.request().method() !== 'POST') return route.fallback(); // the held first load
        await loaded;
        await route.continue();
      }
    );
    await sendFromComposer(page, text);
    releaseFirstLoad();
    await firstLoad;
    firstLoadDone();

    await expect(page.locator('cometchat-message-list').getByText(text)).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Failed send ─────────────────────────────────────────────────────────────

test.describe('Failed send', () => {
  test('a message that fails to send stays in the list with the error tick', async ({ page }) => {
    // ENG-39942: the failed message used to stay in the list looking sent (no error tick), because
    // the composer never recorded the failure on it.
    const secondaryName = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    const list = await openConversation(page, secondaryName);
    await scrollToLatestMessage(page);
    await page.route(/\/messages(\?|$)/, (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'ERR_E2E_FORCED', message: 'Forced failure' } }),
          })
        : route.continue()
    );

    const text = `This send will fail [${uniqueTag()}]`;
    await sendFromComposer(page, text);

    const failed = list.locator('.cometchat-message-bubble').filter({ hasText: text });
    await expect(failed).toBeVisible({ timeout: 15_000 });
    await expect(failed.getByRole('img', { name: 'Message failed to send' })).toBeVisible();
  });
});

// ─── Rich text ───────────────────────────────────────────────────────────────

test.describe('Rich text', () => {
  /** Each markdown format, the element the text bubble renders it as, and that element's text. */
  const FORMATS = [
    { name: 'bold', markdown: (t: string) => `**${t}**`, element: 'strong' },
    { name: 'italic', markdown: (t: string) => `*${t}*`, element: 'em' },
    { name: 'underline', markdown: (t: string) => `__${t}__`, element: 'u' },
    { name: 'strikethrough', markdown: (t: string) => `~~${t}~~`, element: 's' },
    { name: 'inline code', markdown: (t: string) => `\`${t}\``, element: 'code' },
    { name: 'code block', markdown: (t: string) => '```\n' + t + '\n```', element: 'pre' },
    { name: 'blockquote', markdown: (t: string) => `> ${t}`, element: 'blockquote' },
    { name: 'ordered list', markdown: (t: string) => `1. ${t}\n2. second item`, element: 'ol li' },
    { name: 'unordered list', markdown: (t: string) => `- ${t}\n- second item`, element: 'ul li' },
    { name: 'link', markdown: (t: string) => `[${t}](https://www.cometchat.com)`, element: 'a[href="https://www.cometchat.com"]' },
  ];

  const textBubble = (page: Page, messageId: string) => bubble(page, messageId).locator('cometchat-text-bubble');

  for (const format of FORMATS) {
    test(`a received ${format.name} message renders as rich text`, async ({ page }) => {
      const label = `${format.name} part ${uniqueTag()}`;
      // Block formats (quote, lists, code block) only apply at the start of a line.
      const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Format check\n${format.markdown(label)}`);

      await openSecondaryChat(page);

      const rendered = textBubble(page, id);
      await expect(rendered.locator(format.element).filter({ hasText: label })).toBeVisible({ timeout: 30_000 });
      await expect(rendered).not.toContainText('**');
      await expect(rendered).not.toContainText('__');
      await expect(rendered).not.toContainText('~~');
    });
  }

  test('combined formats render together: bold+italic, and bold inside a list item', async ({ page }) => {
    const runId = uniqueTag();
    const boldItalic = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `***both ${runId}***`);
    const boldInList = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `- plain then **bold item ${runId}**\n- next`);

    await openSecondaryChat(page);

    await expect(
      textBubble(page, boldItalic).locator('strong em, em strong').filter({ hasText: `both ${runId}` })
    ).toBeVisible({ timeout: 30_000 });
    await expect(textBubble(page, boldInList).locator('li strong').filter({ hasText: `bold item ${runId}` })).toBeVisible();
  });

  test('bold, italic and underline typed in the composer render in the sent bubble', async ({ page }) => {
    const list = await openSecondaryChat(page);
    const runId = uniqueTag();
    const input = page.locator('cometchat-message-composer [contenteditable="true"]').first();

    await input.click();
    for (const [shortcut, text] of [
      ['ControlOrMeta+b', `bold ${runId}`],
      ['ControlOrMeta+i', `italic ${runId}`],
      ['ControlOrMeta+u', `underline ${runId}`],
    ] as const) {
      await page.keyboard.press(shortcut);
      await page.keyboard.type(text);
      await page.keyboard.press(shortcut);
      await page.keyboard.type(' ');
    }
    await page.keyboard.press('Enter');

    const sent = list.locator('.cometchat-message-list__message').filter({ hasText: `bold ${runId}` }).last();
    await expect(sent.locator('strong').filter({ hasText: `bold ${runId}` })).toBeVisible({ timeout: 30_000 });
    await expect(sent.locator('em').filter({ hasText: `italic ${runId}` })).toBeVisible();
    await expect(sent.locator('u').filter({ hasText: `underline ${runId}` })).toBeVisible();
    await expect(sent).not.toContainText('**');
  });

  test('a quoted formatted message shows plain text in the reply preview, without markers', async ({ page }) => {
    const runId = uniqueTag();
    const original = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `**Quoted bold ${runId}** and *italic*`);
    const reply = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Replying ${runId}`, original);

    await openSecondaryChat(page);

    const preview = bubble(page, reply).locator('.cometchat-message-bubble__body-reply-view');
    await expect(preview).toContainText(`Quoted bold ${runId}`, { timeout: 30_000 });
    await expect(preview).not.toContainText('**');
    await expect(preview).not.toContainText('*italic*');
  });
});

// ─── Bubble per type ─────────────────────────────────────────────────────────

test.describe('Bubble per type', () => {
  // Public, stable media so the bubbles have something real to load.
  const MEDIA = {
    image: { url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp', name: 'e2e-image.webp', extension: 'webp', mimeType: 'image/webp' },
    video: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', name: 'e2e-video.mp4', extension: 'mp4', mimeType: 'video/mp4' },
    audio: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', name: 'e2e-audio.mp3', extension: 'mp3', mimeType: 'audio/mpeg' },
    file: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: 'e2e-file.pdf', extension: 'pdf', mimeType: 'application/pdf' },
  };

  /** Send a media message from the secondary user, optionally with metadata. */
  const sendMedia = (type: keyof typeof MEDIA, metadata?: object) =>
    sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'message',
      type,
      data: { attachments: [{ ...MEDIA[type], size: 1024 }], ...(metadata ? { metadata } : {}) },
    });

  /** A custom message whose data the matching extension would normally inject server-side. */
  const sendExtension = (type: string, extension: string, injected: object) =>
    sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'custom',
      type,
      data: { customData: injected, metadata: { '@injected': { extensions: { [extension]: injected } } } },
    });

  test('text renders in a text bubble', async ({ page }) => {
    const text = `Plain text ${uniqueTag()}`;
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-text-bubble')).toHaveText(text, { timeout: 30_000 });
  });

  test('an edited text shows the new text and the "Edited" label', async ({ page }) => {
    const runId = uniqueTag();
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Before edit ${runId}`);
    await editTextAs(SECONDARY_USER, id, `After edit ${runId}`);
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-text-bubble')).toHaveText(`After edit ${runId}`, { timeout: 30_000 });
    await expect(bubble(page, id)).toContainText('Edited');
  });

  test('an image renders in an image bubble', async ({ page }) => {
    const id = await sendMedia('image');
    await openSecondaryChat(page);
    // The server serves its own thumbnail URL, so check the rendered image, not the source URL.
    await expect(bubble(page, id).locator('cometchat-image-bubble img.cometchat-image-bubble__image')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('a video renders in a video bubble', async ({ page }) => {
    const id = await sendMedia('video');
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-videos-bubble')).toBeVisible({ timeout: 30_000 });
  });

  test('an audio file renders in an audio bubble', async ({ page }) => {
    const id = await sendMedia('audio');
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-audios-bubble')).toBeVisible({ timeout: 30_000 });
    await expect(bubble(page, id).locator('cometchat-voice-note-bubble')).toHaveCount(0);
  });

  test('a voice note renders in a voice-note bubble, not a plain audio bubble', async ({ page }) => {
    const id = await sendMedia('audio', { audioType: 'voice_note' });
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-voice-note-bubble')).toBeVisible({ timeout: 30_000 });
    await expect(bubble(page, id).locator('cometchat-audios-bubble')).toHaveCount(0);
  });

  test('a file renders in a file bubble with its name', async ({ page }) => {
    const id = await sendMedia('file');
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-files-bubble')).toContainText('e2e-file', { timeout: 30_000 });
  });

  test('a sticker renders in a sticker bubble', async ({ page }) => {
    const id = await sendCustomAs(SECONDARY_USER, PRIMARY_USER, 'extension_sticker', {
      sticker_url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-3.webp',
      sticker_name: 'e2e',
    });
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-sticker-bubble img')).toBeVisible({ timeout: 30_000 });
  });

  test('a poll renders its question and options', async ({ page }) => {
    const question = `E2E poll ${uniqueTag()}?`;
    const id = await sendExtension('extension_poll', 'polls', {
      id: `e2e-poll-${uniqueTag()}`,
      question,
      options: { '1': 'Yes please', '2': 'No thanks' },
      results: { total: 0, options: { '1': { text: 'Yes please', count: 0 }, '2': { text: 'No thanks', count: 0 } } },
    });
    await openSecondaryChat(page);
    const poll = bubble(page, id).locator('cometchat-poll-bubble');
    await expect(poll).toContainText(question, { timeout: 30_000 });
    await expect(poll).toContainText('Yes please');
    await expect(poll).toContainText('No thanks');
  });

  test('a collaborative document renders with an Open button', async ({ page }) => {
    const id = await sendExtension('extension_document', 'document', { document_url: 'https://www.cometchat.com/e2e-doc' });
    await openSecondaryChat(page);
    const doc = bubble(page, id).locator('cometchat-collaborative-document-bubble');
    await expect(doc).toBeVisible({ timeout: 30_000 });
    await expect(doc.getByRole('button')).toBeVisible();
  });

  test('a collaborative whiteboard renders with an Open button', async ({ page }) => {
    const id = await sendExtension('extension_whiteboard', 'whiteboard', { board_url: 'https://www.cometchat.com/e2e-board' });
    await openSecondaryChat(page);
    const board = bubble(page, id).locator('cometchat-collaborative-whiteboard-bubble');
    await expect(board).toBeVisible({ timeout: 30_000 });
    await expect(board.getByRole('button')).toBeVisible();
  });

  test('a meeting renders in a call bubble with Join', async ({ page }) => {
    const id = await sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'custom',
      type: 'meeting',
      data: { customData: { callType: 'video', sessionID: `e2e-session-${uniqueTag()}` } },
    });
    await openSecondaryChat(page);
    const call = bubble(page, id).locator('cometchat-call-bubble');
    await expect(call).toBeVisible({ timeout: 30_000 });
    await expect(call.getByRole('button', { name: 'Join' })).toBeVisible();
  });

  test('a card renders its content in a card bubble', async ({ page }) => {
    const content = `E2E card body ${uniqueTag()}`;
    const id = await sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'card',
      type: 'card',
      data: { card: { fallbackText: 'E2E card fallback', version: '1.0', body: [{ type: 'text', id: 'e2e-text', content }] } },
    });
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-card-bubble')).toContainText(content, { timeout: 30_000 });
  });

  test('a card the renderer cannot draw shows its fallback text', async ({ page }) => {
    // Known UI Kit defect (ENG-40824): when the renderer skips every element it doesn't support, the
    // card bubble renders empty instead of showing fallbackText. Expected to fail until fixed.
    test.fail();
    const fallback = `E2E card fallback ${uniqueTag()}`;
    const id = await sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'card',
      type: 'card',
      // The server requires a non-empty body, so use an element type the renderer doesn't know.
      data: { card: { fallbackText: fallback, version: '1.0', body: [{ type: 'e2eUnknownElement', id: 'e2e-x' }] } },
    });
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-card-bubble')).toContainText(fallback, { timeout: 15_000 });
  });

  test('a deleted message renders the deleted bubble', async ({ page }) => {
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `To delete ${uniqueTag()}`);
    await deleteMessageAs(SECONDARY_USER, id);
    await openSecondaryChat(page);
    await expect(bubble(page, id).locator('cometchat-delete-bubble')).toBeVisible({ timeout: 30_000 });
  });

  test('an unknown custom type is left out without breaking the list', async ({ page }) => {
    // The list only requests the message types it can render, so an unknown custom type
    // never reaches it (there is no "not supported" bubble to show).
    const unknownId = await sendCustomAs(SECONDARY_USER, PRIMARY_USER, 'e2e_unknown_type', { anything: true });
    const after = `After the unknown type ${uniqueTag()}`;
    const afterId = await sendTextAs(SECONDARY_USER, PRIMARY_USER, after);
    await openSecondaryChat(page);
    await expect(bubble(page, afterId).locator('cometchat-text-bubble')).toHaveText(after, { timeout: 30_000 });
    await expect(bubble(page, unknownId)).toHaveCount(0);
  });
});
