import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  createE2EUser,
  createE2EGroup,
  sendTextAs,
  sendMessageAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Security: hostile content in messages, file names, user names and group names must render
 * as inert text. Every payload tries to set `window.__xss` or open a dialog; a test fails if
 * any script ran, a dialog opened, or a link/element with a script-capable attribute exists.
 *
 * Note: the project's known one-click XSS is in cometchat-markdown-renderer, which renders
 * AI/agent messages; that path needs an agent configured in the app and is not reached here.
 * These tests cover the text bubble, file bubble, conversation list, header and mentions.
 */

const dialogs = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const seen: string[] = [];
  dialogs.set(page, seen);
  page.on('dialog', async (d) => {
    seen.push(`${d.type()}: ${d.message()}`);
    await d.dismiss();
  });
});

/** Fails if any payload executed: the marker is set or a dialog opened. */
async function expectNoScriptRan(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __xss?: unknown }).__xss), 'window.__xss marker').toBeUndefined();
  expect(dialogs.get(page) ?? [], 'dialogs opened').toEqual([]);
}

/** Fails if `scope` contains a script-capable link or any element with an inline event handler. */
async function expectNoActiveContent(scope: Locator) {
  const problems = await scope.evaluateAll((roots) => {
    const found: string[] = [];
    const unsafe = /^(javascript|vbscript|data):/i;
    for (const root of roots) {
      for (const el of root.querySelectorAll('*')) {
        for (const attr of Array.from(el.attributes)) {
          if (/^on/i.test(attr.name)) found.push(`<${el.tagName.toLowerCase()} ${attr.name}>`);
          if (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(attr.name.toLowerCase())) {
            // Strip whitespace and control characters, as browsers do when parsing a URL scheme.
            const value = attr.value.replace(/[\u0000- ]/g, '');
            if (unsafe.test(value) && !/^data:image\//i.test(value)) found.push(`<${el.tagName.toLowerCase()} ${attr.name}="${attr.value.slice(0, 40)}">`);
          }
        }
        if (['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED'].includes(el.tagName)) found.push(`<${el.tagName.toLowerCase()}>`);
      }
    }
    return found;
  });
  expect(problems, 'script-capable content').toEqual([]);
}

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
}

const bubble = (page: Page, id: string) =>
  page.locator(`cometchat-messages .cometchat-message-list__message[data-message-id="${id}"]`);

// ─── Links with dangerous schemes ────────────────────────────────────────────

test.describe('Links', () => {
  const SCHEMES = [
    { name: 'javascript:', url: 'javascript:window.__xss=1', smoke: true },
    { name: 'mixed-case JaVaScRiPt:', url: 'JaVaScRiPt:window.__xss=1' },
    { name: 'javascript: with leading spaces', url: '   javascript:window.__xss=1' },
    { name: 'javascript: split by a tab', url: 'java\tscript:window.__xss=1' },
    { name: 'data:text/html', url: 'data:text/html,<script>window.__xss=1</script>' },
    { name: 'vbscript:', url: 'vbscript:window.__xss=1' },
  ];

  for (const scheme of SCHEMES) {
    test(`a markdown link with ${scheme.name} is not a live link, and clicking it runs nothing${'smoke' in scheme ? ' @smoke' : ''}`, async ({ page }) => {
      const label = `Open invoice ${uniqueTag()}`;
      const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Please see [${label}](${scheme.url})`);
      await openSecondaryChat(page);
      const message = bubble(page, id);
      await expect(message).toContainText(label, { timeout: 30_000 });

      await expectNoActiveContent(message);
      await message.getByText(label).click();
      await expectNoScriptRan(page);
    });
  }
});

// ─── HTML in message text ────────────────────────────────────────────────────

test.describe('HTML in messages', () => {
  const PAYLOADS = [
    '<img src=x onerror="window.__xss=1">',
    '<script>window.__xss=1</script>',
    '<svg onload="window.__xss=1"></svg>',
    '<a href="javascript:window.__xss=1">click me</a>',
    '"><img src=x onerror=window.__xss=1>',
    '<iframe src="javascript:window.__xss=1"></iframe>',
  ];

  for (const payload of PAYLOADS) {
    test(`message text ${payload.slice(0, 32)}… is shown as text and runs nothing${payload === PAYLOADS[0] ? ' @smoke' : ''}`, async ({ page }) => {
      const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Hostile: ${payload}`);
      await openSecondaryChat(page);
      const message = bubble(page, id);
      await expect(message).toContainText('Hostile:', { timeout: 30_000 });

      await expectNoActiveContent(message);
      await expectNoScriptRan(page);
    });
  }

  test('a file name with HTML is shown as text and runs nothing', async ({ page }) => {
    const id = await sendMessageAs(SECONDARY_USER, PRIMARY_USER, {
      category: 'message',
      type: 'file',
      data: {
        attachments: [
          {
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            name: '<img src=x onerror=window.__xss=1>report.pdf',
            extension: 'pdf',
            mimeType: 'application/pdf',
            size: 1024,
          },
        ],
      },
    });
    await openSecondaryChat(page);
    const message = bubble(page, id);
    await expect(message.locator('cometchat-files-bubble')).toBeVisible({ timeout: 30_000 });

    await expectNoActiveContent(message);
    await expectNoScriptRan(page);
  });
});

// ─── HTML in names ───────────────────────────────────────────────────────────

test.describe('HTML in names', () => {
  test("a user's display name with HTML is escaped in the chat list, header and mentions", async ({ page }) => {
    const runId = uniqueTag();
    const evil = { uid: `e2e-evil-${runId}`, name: `Evil<img src=x onerror=window.__xss=1>${runId}` };
    await createE2EUser(evil.uid, evil.name);
    // Moderation's AI rules flagged "hi from a hostile name <tag>" from this sender as a scam
    // (AI Scam detection); the name is what's under test, so keep the text plainly conversational.
    await sendTextAs(evil.uid, PRIMARY_USER, `Hi there, how was your weekend ${runId}`);
    const mentionId = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Ping <@uid:${evil.uid}> ${runId}`);
    await loginToApp(page);

    // Chat list: the name is shown literally and adds no element.
    const row = conversationRow(page, evil.name);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expectNoActiveContent(row);

    // Header.
    await openConversation(page, evil.name);
    await expect(page.locator('cometchat-message-header')).toContainText(evil.name);
    await expectNoActiveContent(page.locator('cometchat-message-header'));

    // Mention chip in another chat.
    await openConversation(page, await getUserName(SECONDARY_USER));
    await scrollToLatestMessage(page);
    await expect(bubble(page, mentionId)).toContainText(`${runId}`, { timeout: 30_000 });
    await expectNoActiveContent(bubble(page, mentionId));
    await expectNoScriptRan(page);
  });

  test('a group name with HTML is escaped in the chat list and header', async ({ page }) => {
    const runId = uniqueTag();
    const name = `Grp<b>bold</b><img src=x onerror=window.__xss=1>${runId}`;
    await createE2EGroup(`e2e-evil-group-${runId}`, name, PRIMARY_USER, [SECONDARY_USER]);
    await loginToApp(page);

    const row = conversationRow(page, name);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expectNoActiveContent(row);
    await expect(row.locator('b')).toHaveCount(0);

    await openConversation(page, name);
    await expectNoActiveContent(page.locator('cometchat-message-header'));
    await expectNoScriptRan(page);
  });
});
