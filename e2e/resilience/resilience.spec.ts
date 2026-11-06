import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Resilience: sending while offline, catching up after a reconnect, and recovering from
 * failed list loads. Offline uses Playwright's network emulation (`context.setOffline`),
 * which cuts both HTTP and the realtime socket. API failures are a forced HTTP 500 on the
 * first matching request (`page.route`); every later request goes to the real backend.
 */

const messageList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const messageRow = (page: Page, text: string) =>
  messageList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();
const receipt = (page: Page, text: string) => messageRow(page, text).locator('.cometchat-receipts');

async function sendFromComposer(page: Page, text: string) {
  await page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first().click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
}

/** Fail the first GET whose URL matches `pattern` with HTTP 500; let everything else through. */
async function failFirstLoad(page: Page, pattern: RegExp) {
  let failNext = true;
  await page.route(pattern, async (route) => {
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
}

// ─── Sending while offline ───────────────────────────────────────────────────

test.describe('Sending while offline', () => {
  test('a message sent while offline shows as sending, not sent @quarantine (ENG-40994)', async ({ page, context }) => {
    // @quarantine (ENG-40994): in about 1 run in 3 a dropped connection replaces the whole chat
    // with "Something went wrong" (a failed reload empties the list first), so the row is gone.
    await openSecondaryChat(page);
    await context.setOffline(true);

    const text = `Offline send ${uniqueTag()}`;
    await sendFromComposer(page, text);

    // Sending, or already failed (ENG-39942 moves it to the failed tick, sometimes before the first
    // check): never sent. The row must stay in the list.
    await expect(receipt(page, text)).toHaveClass(/cometchat-receipts-(wait|error)/, { timeout: 15_000 });
    await expect(messageRow(page, text)).toBeVisible();
    await expect(
      messageRow(page, text).locator('.cometchat-receipts-sent, .cometchat-receipts-delivered, .cometchat-receipts-read')
    ).toHaveCount(0);
    await context.setOffline(false);
  });

  test('a message whose send failed offline shows the failed state @quarantine (ENG-40993)', async ({ page, context }) => {
    // @quarantine (ENG-40993): the offline variant of ENG-39942. Since the ENG-39942 fix (#659)
    // the bubble usually switches to the failed tick, but in about 1 run in 3 it stays on the
    // "sending" clock. Intermittent, so quarantined rather than expected to fail.
    await openSecondaryChat(page);
    await context.setOffline(true);

    const text = `Offline fail ${uniqueTag()}`;
    await sendFromComposer(page, text);

    await expect(receipt(page, text)).toHaveClass(/cometchat-receipts-error/, { timeout: 30_000 });
    await context.setOffline(false);
  });

  test('a message sent while offline is delivered once back online', async ({ page, context }) => {
    // Known UI Kit defect (offline variant of ENG-39942): the send is tried once and never
    // re-sent after reconnecting — it stays "sending" and is gone after a reload. Expected to
    // fail until fixed.
    test.fail();
    await openSecondaryChat(page);
    await context.setOffline(true);

    const text = `Offline then online ${uniqueTag()}`;
    // Reconnect only after the send has actually failed, so the outage covers the send.
    const sendFailed = page.waitForEvent('requestfailed', (r) => r.method() === 'POST' && /\/messages$/.test(r.url()));
    await sendFromComposer(page, text);
    await sendFailed;
    await expect(receipt(page, text)).toHaveClass(/cometchat-receipts-wait/, { timeout: 15_000 });

    await context.setOffline(false);
    await expect(receipt(page, text)).toHaveClass(/cometchat-receipts-(sent|delivered|read)/, { timeout: 30_000 });
  });
});

// ─── Reconnect ───────────────────────────────────────────────────────────────

test.describe('Reconnect', () => {
  // Messages arrive over the realtime connection, which drops about 1 in 10 live events.
  test.describe.configure({ retries: 1 });

  test('messages sent to you while offline appear after reconnecting, without a reload', async ({ page, context }) => {
    await openSecondaryChat(page);
    await context.setOffline(true);

    const text = `Missed while offline ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await expect(messageRow(page, text)).toHaveCount(0);

    await context.setOffline(false);
    await expect(messageRow(page, text)).toBeVisible({ timeout: 30_000 });
  });

  test('after reconnecting, a new message sends normally', async ({ page, context }) => {
    await openSecondaryChat(page);
    await context.setOffline(true);
    await context.setOffline(false);

    const text = `Back online ${uniqueTag()}`;
    await expect(async () => {
      if (!(await messageRow(page, text).count())) await sendFromComposer(page, text);
      await expect(receipt(page, text)).toHaveClass(/cometchat-receipts-(sent|delivered|read)/, { timeout: 10_000 });
    }).toPass({ timeout: 40_000 });
  });
});

// ─── Failed list loads ───────────────────────────────────────────────────────

test.describe('Failed list loads', () => {
  const LISTS = [
    { name: 'users', tab: 'Users', url: /\/v3\.0\/users(\?|$)/, host: 'cometchat-users', items: 'cometchat-user-item' },
    { name: 'groups', tab: 'Groups', url: /\/v3\.0\/groups(\?|$)/, host: 'cometchat-groups', items: 'cometchat-group-item' },
    {
      name: 'call logs',
      tab: 'Calls',
      url: /\/v3\.0\/calls(\?|$)/,
      host: 'cometchat-call-logs',
      items: '.cometchat-call-logs__list-item',
      // ENG-40992: call logs' Retry is a stub — it shows loading for 300 ms and sets the error
      // state again without refetching. Expected to fail until fixed.
      knownDefect: true,
    },
  ];

  for (const list of LISTS) {
    test(`the ${list.name} list shows an error view when loading fails, and Retry loads it`, async ({ page }) => {
      if (list.knownDefect) test.fail();
      await loginToApp(page);
      await failFirstLoad(page, list.url);
      await page.getByLabel('Navigation tabs').getByRole('tab', { name: list.tab }).click();

      const host = page.locator(list.host);
      const errorView = host.locator(`.${list.host}__error-state-view`);
      await expect(errorView).toBeVisible({ timeout: 30_000 });

      await host.locator(`.${list.host}__error-state-view-retry-button`).click();
      await expect(errorView).toBeHidden({ timeout: 30_000 });
      await expect(host.locator(list.items).first()).toBeVisible({ timeout: 30_000 });
    });
  }

  test('the message list shows an error view when loading fails, and Retry loads the messages', async ({ page }) => {
    const text = `Before the failed load ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await loginToApp(page);
    await failFirstLoad(page, new RegExp(`/users/${SECONDARY_USER}/messages(\\?|$)`));
    const errorView = messageList(page).locator('.cometchat-message-list__error');
    // The first click on a chat sometimes does not open it (ENG-39945), so click until it does.
    await expect(async () => {
      await conversationRow(page, await getUserName(SECONDARY_USER)).click();
      await expect(errorView).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });

    await errorView.getByRole('button', { name: 'Retry' }).click();
    await expect(errorView).toBeHidden({ timeout: 30_000 });
    await expect(messageRow(page, text)).toBeVisible({ timeout: 30_000 });
  });
});
