import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  createE2EUser,
  sendTextAs,
  sendMessageAs,
  searchMessagesAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Search: global search (conversations and messages), the message-type filters, and
 * keywords with accents, emoji, CJK and regex-like characters. Every assertion waits on
 * UI state; result items are identified by their `search-message-item-<id>` test id.
 */

const resultItem = (search: Locator, messageId: string) => search.getByTestId(`search-message-item-${messageId}`);

/**
 * A unique tag of letters only. Server search splits a keyword that mixes letters and digits
 * into pieces and matches on those, so a mixed tag also matches unrelated messages.
 */
const letterTag = () => uniqueTag().replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);

/** Open global search from the Chats panel's search bar. */
async function openGlobalSearch(page: Page): Promise<Locator> {
  await page.locator('cometchat-conversations').getByRole('searchbox').click();
  const search = page.locator('cometchat-search').first();
  await expect(search).toBeVisible();
  return search;
}

/** Type a keyword and wait until `ready` holds (search is debounced and results arrive async). */
async function searchFor(search: Locator, keyword: string, ready: () => Promise<void>) {
  const box = search.getByRole('searchbox');
  await expect(async () => {
    await box.fill(keyword);
    await ready();
  }).toPass({ timeout: 30_000 });
}

// ─── Global search ───────────────────────────────────────────────────────────

test.describe('Global search', () => {
  test('finds a conversation by name @smoke', async ({ page }) => {
    const name = await getUserName(SECONDARY_USER);
    await loginToApp(page);
    const search = await openGlobalSearch(page);

    await searchFor(search, name, async () => {
      await expect(search.locator('.cometchat-search__results')).toContainText('Conversations', { timeout: 5_000 });
    });

    await expect(search.locator('.cometchat-search__results')).toContainText(name);
  });

  test('finds a message by text; clicking it opens the chat and jumps to the message @smoke', async ({ page }) => {
    // Letters only. Server search breaks a keyword that mixes letters and digits into
    // pieces and matches on those, so `globalfindmvm5u1ug10f` also matched "Later filler 10",
    // "Look for globalfindmvm5phk0uew here" and more — and the newest of those fill the
    // 3-row message preview ahead of the target. A pure-letter word matches only itself.
    const token = `globalfind${letterTag()}`;
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Look for ${token} here`);
    // Push the target off the latest page, so opening it has to jump. The filler must
    // share no search piece with the token, or it crowds the target out of the preview.
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => sendTextAs(SECONDARY_USER, PRIMARY_USER, `Later filler ${i + 1}`))
    );
    await loginToApp(page);
    const search = await openGlobalSearch(page);

    await searchFor(search, token, async () => {
      await expect(resultItem(search, id)).toBeVisible({ timeout: 5_000 });
    });
    await resultItem(search, id).click();

    await expect(page.locator('cometchat-message-header')).toContainText(await getUserName(SECONDARY_USER));
    const target = page.locator(`cometchat-messages .cometchat-message-list__message[data-message-id="${id}"]`);
    await expect(target).toBeInViewport({ timeout: 15_000 });
    await expect(target).toHaveClass(/cometchat-message-list__message--highlighted/);
  });

  test('is case-insensitive', async ({ page }) => {
    const token = `CaseCheck${uniqueTag()}`;
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `mixed ${token} text`);
    await loginToApp(page);
    const search = await openGlobalSearch(page);

    await searchFor(search, token.toUpperCase(), async () => {
      await expect(resultItem(search, id)).toBeVisible({ timeout: 5_000 });
    });
  });

  test('a keyword with no matches shows "No Results"', async ({ page }) => {
    await loginToApp(page);
    const search = await openGlobalSearch(page);

    // Letters only: "zz-nothing-matches-<tag>" was split into pieces such as "matches" and
    // "nothing", which matched other messages.
    await searchFor(search, `qzxnomatch${letterTag()}`, async () => {
      await expect(search).toContainText('No Results', { timeout: 5_000 });
    });
  });
});

// ─── Special characters ──────────────────────────────────────────────────────

test.describe('Special characters', () => {
  const KEYWORDS = [
    { name: 'accented text', keyword: (r: string) => `Café${r}` },
    { name: 'CJK text', keyword: (r: string) => `日本語${r}` },
    { name: 'regex-like characters', keyword: (r: string) => `(x)[y]a.b${r}` },
  ];

  for (const k of KEYWORDS) {
    test(`finds a message by ${k.name}`, async ({ page }) => {
      const runId = uniqueTag();
      const keyword = k.keyword(runId);
      const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Special ☕ ${keyword} end`);
      await loginToApp(page);
      const search = await openGlobalSearch(page);

      await searchFor(search, keyword, async () => {
        await expect(resultItem(search, id)).toBeVisible({ timeout: 5_000 });
      });
      await expect(resultItem(search, id)).toContainText(keyword);
    });
  }
});

// ─── Filters ─────────────────────────────────────────────────────────────────

test.describe('Filters', () => {
  /**
   * A new user sends one message of each type to the primary user, all carrying the same
   * keyword (media carry it as a caption), so every filter's expected result is known.
   */
  async function seedOneOfEach() {
    const runId = uniqueTag();
    const keyword = `filtercheck${letterTag()}`;
    const sender = { uid: `e2e-filters-${runId}`, name: `E2E Filters ${runId}` };
    await createE2EUser(sender.uid, sender.name);
    // The E2E app's server never returns the first message of a new 1:1 conversation to the
    // receiver (neither the client message fetch nor search finds it), so open the
    // conversation with a message that doesn't carry the keyword.
    await sendTextAs(sender.uid, PRIMARY_USER, 'Hello there');
    const media = (type: string, url: string, name: string, mimeType: string) =>
      sendMessageAs(sender.uid, PRIMARY_USER, {
        category: 'message',
        type,
        data: {
          text: `${type} ${keyword}`,
          attachments: [{ url, name, extension: name.split('.').pop(), mimeType, size: 1024 }],
        },
      });
    const ids = {
      text: await sendTextAs(sender.uid, PRIMARY_USER, `text ${keyword}`),
      image: await media('image', 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp', 'e2e.webp', 'image/webp'),
      video: await media('video', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 'e2e.mp4', 'video/mp4'),
      audio: await media('audio', 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', 'e2e.mp3', 'audio/mpeg'),
      file: await media('file', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'e2e.pdf', 'application/pdf'),
      link: await sendTextAs(sender.uid, PRIMARY_USER, `link ${keyword} https://www.cometchat.com/docs`),
    };
    // New messages take a while to reach the server's search index; wait for all of them.
    await expect
      .poll(async () => (await searchMessagesAs(PRIMARY_USER, keyword)).map((m) => m.id).sort(), { timeout: 120_000 })
      .toEqual(Object.values(ids).sort());
    return { sender, keyword, ids };
  }

  test('each message-type filter shows only messages of that type', async ({ page }) => {
    // Waiting for the search index (see seedOneOfEach) can take a couple of minutes.
    test.setTimeout(240_000);
    const { sender, keyword, ids } = await seedOneOfEach();
    await loginToApp(page);
    await openConversation(page, sender.name);
    await page.locator('cometchat-message-header').getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Search' }).click();
    const search = page.locator('cometchat-search').last();

    // Unfiltered: every message carrying the keyword is found.
    await searchFor(search, keyword, async () => {
      for (const id of Object.values(ids)) await expect(resultItem(search, id)).toBeVisible({ timeout: 5_000 });
    });

    for (const [filter, kind] of [
      ['Photos', 'image'],
      ['Videos', 'video'],
      ['Audio', 'audio'],
      ['Documents', 'file'],
      ['Links', 'link'],
    ] as const) {
      await test.step(`${filter} shows only the ${kind} message`, async () => {
        const chip = search.locator('.cometchat-search__body-filter').filter({ hasText: filter });
        await chip.click();
        await expect(chip).toHaveAttribute('aria-pressed', 'true');
        await expect(resultItem(search, ids[kind])).toBeVisible({ timeout: 15_000 });
        for (const [other, id] of Object.entries(ids)) {
          if (other !== kind) await expect(resultItem(search, id)).toHaveCount(0);
        }
        await chip.click(); // turn the filter off again
        await expect(chip).toHaveAttribute('aria-pressed', 'false');
      });
    }
  });
});
