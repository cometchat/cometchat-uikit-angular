/**
 * Offline support E2E (UIT-* cases from the offline plan), run by
 * `playwright.offline.config.ts` against the harness's fake CometChat server.
 *
 * Each test resets the fake server to the same small world: alex (the user
 * under test) has chats with sam and bea. The server's control plane takes the
 * network down and up and reports every request it received.
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { expectAnsweredRequest, expectNothingFor, expectSocket } from './helpers';

const CONTROL = 'http://127.0.0.1:48789';

const FIXTURES = {
  users: ['alex', 'sam', 'bea'],
  conversations: [{ with: 'sam' }, { with: 'bea' }],
  messages: [
    { with: 'sam', count: 4, from: 'alternate' },
    { with: 'bea', count: 2, from: 'alternate' },
  ],
};

async function control(request: APIRequestContext, path: string, body: unknown): Promise<any> {
  const response = await request.post(`${CONTROL}${path}`, { data: body });
  expect(response.ok(), `control ${path} answered ${response.status()}`).toBeTruthy();
  return response.json().catch(() => ({}));
}

async function serverRequests(request: APIRequestContext, query = ''): Promise<any[]> {
  const response = await request.get(`${CONTROL}/requests${query}`);
  const body = await response.json();
  return Array.isArray(body) ? body : body.requests ?? [];
}

async function login(page: Page, uid = 'alex', query = ''): Promise<void> {
  await page.goto(`/login${query}`);
  await page.locator('#customUid').fill(uid);
  await page.locator('.cometchat-login__submit-button').click();
  await expect(page.locator('cometchat-conversations .cometchat-conversation-item').first()).toBeVisible({ timeout: 45_000 });
}

async function openChat(page: Page, name: string): Promise<void> {
  // The list ignores clicks while it is still loading (ENG-35029), and on the
  // server path it holds the loading state for a minimum shimmer time after the
  // rows are already painted.
  await expect(page.locator('cometchat-conversations .cometchat-paginated-list').first()).toHaveAttribute('aria-busy', 'false');
  await page.locator('cometchat-conversations .cometchat-conversation-item', { hasText: name }).first().click();
  await expect(page.locator('cometchat-message-composer [contenteditable="true"]').first()).toBeVisible();
}

async function send(page: Page, text: string): Promise<void> {
  const input = page.locator('cometchat-message-composer [contenteditable="true"]').first();
  await input.click();
  await input.pressSequentially(text);
  await input.press('Enter');
}

function bubble(page: Page, text: string) {
  return page.locator('cometchat-message-bubble', { hasText: text }).last();
}

test.beforeEach(async ({ request, context }) => {
  await control(request, '/reset', { fixtures: FIXTURES });
  await context.clearCookies();
});

test('UIT-SEND-01/02: an offline send shows at once as not sent yet, never as failed, and sends on reconnect', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await control(request, '/network', { state: 'offline' });

  await send(page, 'written offline');
  const row = bubble(page, 'written offline');
  await expect(row).toBeVisible();
  await expect(row.locator('.cometchat-receipts-wait')).toBeVisible();
  // Queued is not failed: no error tick, no retry affordance (BEH-SEND-10).
  await expect(row.locator('.cometchat-receipts-error')).toHaveCount(0);
  await expect(row.locator('[data-testid="offline-retry"]')).toHaveCount(0);

  await control(request, '/network', { state: 'online' });
  // The SDK's outbox sends it on reconnect; the same row turns sent in place.
  await expect(row.locator('.cometchat-receipts-wait')).toHaveCount(0, { timeout: 45_000 });
  await expect(row.locator('.cometchat-receipts-error')).toHaveCount(0);
  const sends = (await serverRequests(request)).filter(r => r.method === 'POST' && /\/messages$/.test(r.path) && JSON.stringify(r.body ?? '').includes('written offline'));
  expect(sends.length).toBeGreaterThanOrEqual(1);
  // One row, not a duplicate after the ack.
  await expect(page.locator('cometchat-message-bubble', { hasText: 'written offline' })).toHaveCount(1);
});

test('UIT-READ-01/04: offline, a reload paints chats and messages from the device, with no error screen', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await send(page, 'seen before going offline');
  // Sent, not just drawn: a clock that has not rendered yet also has no '.cometchat-receipts-wait'.
  await expect(page.locator('[data-testid="cc-message-row"]', { has: bubble(page, 'seen before going offline') }))
    .toHaveAttribute('data-cc-state', /^(sent|delivered|read)$/, { timeout: 30_000 });

  await control(request, '/network', { state: 'offline' });
  await page.reload();
  await expect(page.locator('cometchat-conversations .cometchat-conversation-item', { hasText: 'sam' }).first()).toBeVisible({ timeout: 45_000 });
  await openChat(page, 'sam');
  await expect(bubble(page, 'seen before going offline')).toBeVisible();
  await expect(page.locator('cometchat-message-list .cometchat-message-list__error, cometchat-message-list [class*="error-state"]')).toHaveCount(0);
});

// The unsent-row menu (BEH-SEND-37), Retry and Delete are covered in offline-journeys.spec.ts.

async function chooseOption(page: Page, row: ReturnType<typeof bubble>, label: RegExp): Promise<void> {
  await row.hover();
  const menu = row.locator('.cometchat-message-bubble__options');
  const quick = menu.locator('[role="menuitem"]:visible');
  for (let i = 0; i < await quick.count(); i++) {
    if (label.test((await quick.nth(i).getAttribute('aria-label')) || '')) { await quick.nth(i).dispatchEvent('click'); return; }
  }
  await menu.locator('.cometchat-menu-list__sub-menu:visible').first().click({ force: true });
  const sub = page.locator('.cometchat-menu-list__sub-menu-list:visible [role="menuitem"]');
  for (let i = 0; i < await sub.count(); i++) {
    const text = ((await sub.nth(i).getAttribute('aria-label')) || (await sub.nth(i).textContent()) || '').trim();
    if (label.test(text)) { await sub.nth(i).dispatchEvent('click'); return; }
  }
  throw new Error(`no option matching ${label}`);
}

test('UIT-LIFE-09/BEH-SEND-30: a message queued offline survives a restart and still shows not sent yet', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await control(request, '/network', { state: 'offline' });
  await send(page, 'queued across restart');
  await expect(bubble(page, 'queued across restart').locator('.cometchat-receipts-wait')).toBeVisible();
  await page.reload();
  await openChat(page, 'sam');
  const row = bubble(page, 'queued across restart');
  await expect(row).toBeVisible();
  await expect(row.locator('.cometchat-receipts-wait')).toBeVisible();
  await expect(row.locator('.cometchat-receipts-error')).toHaveCount(0);
  await control(request, '/network', { state: 'online' });
  await expect(row.locator('.cometchat-receipts-wait')).toHaveCount(0, { timeout: 45_000 });
  await expect(page.locator('cometchat-message-bubble', { hasText: 'queued across restart' })).toHaveCount(1);
});

test('UIT-SYNC-01: on reconnect with offline on, the message list makes no fetch of its own', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  // The first open has finished: the realtime socket is up and the server has answered the chat's first read.
  await expectSocket(request, true);
  await expectAnsweredRequest(request, 0, r => r.method === 'GET' && r.path === '/users/sam/messages');
  await control(request, '/network', { state: 'offline' });
  // Cut the realtime socket too, so the SDK really reconnects (onConnected fires).
  await control(request, '/socket', { action: 'drop' });
  await expectSocket(request, false);
  const before = await serverRequests(request);
  const lastSeq = Math.max(0, ...before.map(r => Number(r.seq) || 0));
  await control(request, '/network', { state: 'online' });
  // The reconnect has happened and the SDK's own sweep has read from the server ...
  await expectSocket(request, true);
  await expectAnsweredRequest(request, lastSeq, r => r.method === 'GET');
  // ... and then the kit makes no read of its own over a period in which it would have.
  await expectNothingFor(page, 5_000, 'the message list and conversation list start no fetch of their own after the reconnect');
  const after = (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > lastSeq);
  // The kit's message-list read is GET /users/sam/messages; the SDK's sweep reads the changelog instead.
  const kitReads = after.filter(r => r.method === 'GET' && r.path === '/users/sam/messages');
  expect(kitReads, JSON.stringify(after.map(r => `${r.method} ${r.path}`))).toHaveLength(0);
  // The conversation list makes no fetch of its own either (the SDK's sweep reads conversations once).
  const convReads = after.filter(r => r.method === 'GET' && r.path === '/conversations' && r.query?.per_page === '30');
  expect(convReads).toHaveLength(0);
});

test('UIT-OFF-01/02: with offline off, an offline send fails as before and nothing is queued or cached', async ({ page, request }) => {
  await login(page, 'alex', '?offline=0');
  await openChat(page, 'sam');
  const readsBefore = (await serverRequests(request)).filter(r => r.method === 'GET' && r.path === '/users/sam/messages');
  expect(readsBefore.length).toBeGreaterThanOrEqual(1);
  await control(request, '/network', { state: 'offline' });
  await send(page, 'sent with offline off');
  const row = bubble(page, 'sent with offline off');
  // Today's behaviour: the send fails and shows the error tick; no "not sent yet" clock, no Retry affordance.
  await expect(row.locator('.cometchat-receipts-error')).toBeVisible({ timeout: 30_000 });
  await expect(row.locator('[data-testid="offline-retry"]')).toHaveCount(0);
  await control(request, '/network', { state: 'online' });
  await expectSocket(request, true);
  await expectNothingFor(page, 5_000, 'a failed offline-off send is not delivered after the reconnect');
  // Nothing was queued: the failed send is never delivered on reconnect.
  const delivered = (await serverRequests(request)).filter(r => r.method === 'POST' && r.path === '/messages' && r.outcome !== 'refused' && JSON.stringify(r.body ?? '').includes('sent with offline off'));
  expect(delivered).toHaveLength(0);
  // No offline database was created for this app.
  const dbs = await page.evaluate(async () => (indexedDB as any).databases ? (await (indexedDB as any).databases()).map((d: any) => d.name) : []);
  expect(dbs.filter((n: string) => /offline|cometchat.*cache|outbox/i.test(n ?? ''))).toEqual([]);
});

/** The conversation row for a 1:1 chat, by its state-contract identifier. */
function conversationRow(page: Page, uid: string) {
  return page.locator(`cometchat-conversations [data-testid="cc-conversation-row"][data-cc-with="user:${uid}"]`);
}

/** Request-log sequence number of the newest request so far. */
async function lastSeq(request: APIRequestContext): Promise<number> {
  return Math.max(0, ...(await serverRequests(request)).map(r => Number(r.seq) || 0));
}

test('UIT-SYNC-02: messages others sent while offline appear in the open chat after reconnect, without reopening', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await control(request, '/network', { state: 'offline' });
  await control(request, '/socket', { action: 'drop' });
  await control(request, '/fixtures', { messages: [{ with: 'sam', count: 2, from: 'peer', text: 'while you were away' }], merge: true });
  await control(request, '/network', { state: 'online' });
  await expect(bubble(page, 'while you were away 1')).toBeVisible({ timeout: 45_000 });
  await expect(bubble(page, 'while you were away 2')).toBeVisible();
  // Each once: the sweep and any live delivery never duplicate a row.
  await expect(page.locator('cometchat-message-bubble', { hasText: 'while you were away 1' })).toHaveCount(1);
});

test('UIT-SYNC-05: socket flapping sends a queued message once and loses nothing', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await control(request, '/network', { state: 'offline' });
  await send(page, 'sent through the flapping');
  await expect(bubble(page, 'sent through the flapping').locator('.cometchat-receipts-wait')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await control(request, '/network', { state: 'online' });
    await expectSocket(request, true);
    await control(request, '/network', { state: 'offline' });
    await control(request, '/socket', { action: 'drop' });
    await expectSocket(request, false);
  }
  await control(request, '/network', { state: 'online' });
  await expect(bubble(page, 'sent through the flapping').locator('.cometchat-receipts-wait')).toHaveCount(0, { timeout: 45_000 });
  await expectNothingFor(page, 5_000, 'the queued message is not sent a second time after the flapping');
  const accepted = (await serverRequests(request)).filter(r => r.method === 'POST' && r.path === '/messages' && r.outcome === 'answered' && JSON.stringify(r.body ?? '').includes('sent through the flapping'));
  expect(accepted).toHaveLength(1);
  await expect(page.locator('cometchat-message-bubble', { hasText: 'sent through the flapping' })).toHaveCount(1);
});

test('UIT-CONV-09: five messages missed in a closed chat leave its unread count at +5, not +10', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  const bea = conversationRow(page, 'bea');
  await expect(bea).toBeVisible();
  const before = Number(await bea.getAttribute('data-cc-unread'));
  await control(request, '/network', { state: 'offline' });
  await control(request, '/socket', { action: 'drop' });
  await control(request, '/fixtures', { messages: [{ with: 'bea', count: 5, from: 'peer', text: 'missed' }], merge: true });
  await control(request, '/network', { state: 'online' });
  await expect(bea).toHaveAttribute('data-cc-unread', String(before + 5), { timeout: 45_000 });
  // It stays there: no late +1 per swept message.
  await expectNothingFor(page, 5_000, 'no late +1 per swept message reaches the unread count');
  await expect(bea).toHaveAttribute('data-cc-unread', String(before + 5));
});

test('UIT-LIFE-13: after a reload with a restored session, a queued message sends on reconnect without reopening its chat', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await control(request, '/network', { state: 'offline' });
  await send(page, 'queued before the reload');
  await expect(bubble(page, 'queued before the reload').locator('.cometchat-receipts-wait')).toBeVisible();
  await page.goto('/');
  // Restored session: no login screen, and the chat is never reopened.
  await expect(conversationRow(page, 'sam')).toBeVisible({ timeout: 45_000 });
  await control(request, '/network', { state: 'online' });
  await expect.poll(async () => (await serverRequests(request)).filter(r => r.method === 'POST' && r.path === '/messages' && r.outcome === 'answered' && JSON.stringify(r.body ?? '').includes('queued before the reload')).length, { timeout: 45_000 }).toBe(1);
  await expect(conversationRow(page, 'sam')).toHaveAttribute('data-cc-preview-state', /^(sent|delivered|read)$/, { timeout: 30_000 });
});

test('UIT-MUT-01: offline, a reaction or a delete ends in today\'s error and leaves nothing half-done', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  const target = bubble(page, 'message 4');
  await expect(target).toBeVisible();
  await control(request, '/network', { state: 'offline' });
  await control(request, '/socket', { action: 'drop' });
  // Delete: the row stays.
  await chooseOption(page, target, /delete/i);
  const confirm = page.locator('cometchat-confirm-dialog button, .cometchat-confirm-dialog__button--submit, [data-testid="confirm-dialog-submit"]').filter({ hasText: /delete/i }).first();
  if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click();
  await expectNothingFor(page, 3_000, 'an offline delete changes nothing on the row');
  // Today a failed delete leaves its dialog open, over the list: cancel it to go on.
  const cancel = page.locator('.cometchat-confirm-dialog__button-group-cancel button').first();
  if (await cancel.isVisible({ timeout: 3_000 }).catch(() => false)) await cancel.click();
  await expect(bubble(page, 'message 4')).toBeVisible();
  await expect(bubble(page, 'message 4').locator('.cometchat-delete-bubble, [class*="deleted"]')).toHaveCount(0);
  // React: no reaction is left on the row.
  await chooseOption(page, bubble(page, 'message 4'), /react/i).catch(() => undefined);
  const emoji = page.getByRole('dialog', { name: 'Emoji picker' }).getByRole('gridcell').first();
  if (await emoji.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true, () => false)) await emoji.click();
  await expectNothingFor(page, 3_000, 'an offline reaction leaves no reaction on the row');
  await expect(bubble(page, 'message 4').locator('cometchat-reactions, .cometchat-reactions')).toHaveCount(0);
  // Nothing reached the server for either action.
  const writes = (await serverRequests(request)).filter(r => ['DELETE', 'POST'].includes(r.method) && /reactions|\/messages\/\d+$/.test(r.path) && r.outcome === 'answered');
  expect(writes).toHaveLength(0);
});

test('UIT-OFF-03: with offline off, a socket drop and reconnect refreshes the conversation list and makes no message read, as in 5.2.2', async ({ page, request }) => {
  await login(page, 'alex', '?offline=0');
  await openChat(page, 'sam');
  await expectSocket(request, true);
  await expectAnsweredRequest(request, 0, r => r.method === 'GET' && r.path === '/users/sam/messages');
  const since = await lastSeq(request);
  await control(request, '/socket', { action: 'drop' });
  // The message list's connection listener has never been attached (setupConnectionListener has no caller on master-v5).
  await expect.poll(async () => (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > since && r.method === 'GET' && r.path === '/conversations').length, { timeout: 45_000 }).toBeGreaterThanOrEqual(1);
  await expectNothingFor(page, 2_000, 'the message list makes no read after the conversation refresh');
  expect((await serverRequests(request)).filter(r => (Number(r.seq) || 0) > since && r.method === 'GET' && r.path === '/users/sam/messages')).toHaveLength(0);
});

