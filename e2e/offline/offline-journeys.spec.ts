/**
 * Offline support E2E, complete user journeys (offline TEST-PLAN §9 UIT cases
 * and the 2026-10-30 product decision on message actions, BEH-SEND-36/37).
 *
 * Run by `playwright.offline.config.ts` against the harness's fake CometChat
 * server, one platform at a time (the orchestrator says when). Each test resets
 * the server to the same small world (see `FIXTURES`).
 */
import { test, expect } from '@playwright/test';
import {
  acceptedSends, bubble, chooseOption, clearFaults, composerInput, confirmDelete, control, conversationRow,
  conversationsIdle, databases, dropFile, expectAnsweredRequest, expectNoDuplicateKey, expectNoFlash, expectNothingFor,
  expectRowSent, expectRowState, expectSocket,
  FIXTURES, frames, lastSeq, login, loseCacheKey, notice, now, offline, online, openChat, OPTION, optionIds,
  PNG_1PX, row, rowsWith, send, serverRequests,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await control(request, '/reset', { fixtures: FIXTURES });
  await context.clearCookies();
});

const sendFault = (status: number, code: string) => ({
  match: { method: 'POST', path: '/messages' }, kind: 'status', status,
  body: { error: { code, message: 'refused for the test' } }, times: 'always',
});

// ── BEH-SEND-37: what an own unsent message offers ────────────────────────────

test.describe('message actions on unsent messages (BEH-SEND-37 as rewritten by R162 / S73)', () => {
  test('PENDING offers Retry and Delete only: no Copy, reply, react, edit or anything else', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'pending menu');
    await expectRowState(page, 'pending menu', 'sending');
    expect(await optionIds(page, 'pending menu')).toEqual([OPTION.retry, OPTION.discard]);
    // A sent message keeps today's full menu.
    const sentMenu = await optionIds(page, 'message 4');
    expect(sentMenu).toEqual(expect.arrayContaining([OPTION.react, OPTION.reply, OPTION.copy]));
    expect(sentMenu).not.toContain(OPTION.retry);
    expect(sentMenu).not.toContain(OPTION.discard);
  });

  test('Retry on a PENDING row while still offline keeps it waiting, and it sends once on reconnect (UIT-SEND-18)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'retried while offline');
    await expectRowState(page, 'retried while offline', 'sending');
    await chooseOption(page, 'retried while offline', /^Retry$/);
    await chooseOption(page, 'retried while offline', /^Retry$/);
    await expectRowState(page, 'retried while offline', 'sending');
    await online(request);
    await expectRowSent(page, 'retried while offline');
    await expectNothingFor(page, 3_000, 'a second send of the retried message would have reached the server by now');
    expect(await acceptedSends(request, 'retried while offline')).toHaveLength(1);
    await expect(rowsWith(page, 'retried while offline')).toHaveCount(1);
  });

  test('FAILED + TRANSIENT (503) offers Retry and Delete; Retry sends it exactly once (UIT-SEND-17, UIT-SEND-04)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await control(request, '/fault', sendFault(503, 'ERR_SERVICE_UNAVAILABLE'));
    await send(page, 'transient failure');
    await expectRowState(page, 'transient failure', 'failed');
    expect(await optionIds(page, 'transient failure')).toEqual([OPTION.retry, OPTION.discard]);
    await expect(row(page, 'transient failure').locator('[data-testid="offline-retry"]')).toBeVisible();
    // A later message in the same chat is not held up by the failed one.
    await clearFaults(request);
    await send(page, 'after the transient one');
    await expectRowSent(page, 'after the transient one');
    // Never re-sent without a tap (UIT-SEND-12).
    await expectNothingFor(page, 3_000, 'a failed message is never re-sent without a tap');
    expect(await acceptedSends(request, 'transient failure')).toHaveLength(0);
    // Spamming Retry still sends once (BREAK-IT G2).
    const retry = row(page, 'transient failure').locator('[data-testid="offline-retry"]');
    await retry.click();
    await retry.click({ timeout: 1_000 }).catch(() => undefined);
    await expectRowSent(page, 'transient failure');
    await expectNothingFor(page, 3_000, 'a second send from the spammed Retry would have reached the server by now');
    expect(await acceptedSends(request, 'transient failure')).toHaveLength(1);
    await expect(rowsWith(page, 'transient failure')).toHaveCount(1);
  });

  test('FAILED + PERMANENT (422) offers Retry and Delete too (R162); Delete removes it for good, also after a restart', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await control(request, '/fault', sendFault(422, 'ERR_MESSAGE_INVALID'));
    await send(page, 'permanent failure');
    await expectRowState(page, 'permanent failure', 'failed');
    expect(await optionIds(page, 'permanent failure')).toEqual([OPTION.retry, OPTION.discard]);
    await expect(row(page, 'permanent failure').locator('[data-testid="offline-retry"]')).toHaveCount(1);
    await chooseOption(page, 'permanent failure', /^Delete$/);
    await confirmDelete(page);
    await expect(rowsWith(page, 'permanent failure')).toHaveCount(0);
    await clearFaults(request);
    await page.reload();
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await expect(rowsWith(page, 'permanent failure')).toHaveCount(0);
  });

  test('Delete of a PENDING row discards it on the device (works offline, durable); it is never sent (UIT-SEND-09)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'discard me');
    await expectRowState(page, 'discard me', 'sending');
    await chooseOption(page, 'discard me', /^Delete$/);
    await confirmDelete(page);
    await expect(rowsWith(page, 'discard me')).toHaveCount(0);
    // Durable: a relaunch while still offline does not bring it back.
    await page.reload();
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await expect(rowsWith(page, 'discard me')).toHaveCount(0);
    await online(request);
    await expectSocket(request, true);
    await expectNothingFor(page, 5_000, 'a discarded message is not sent after the reconnect');
    expect(await acceptedSends(request, 'discard me')).toHaveLength(0);
    await expect(rowsWith(page, 'discard me')).toHaveCount(0);
  });

  test('queue full: the refused send is failed (direct) with a notice; the queued rows are untouched; its Delete removes it from the screen only (UIT-SEND-08)', async ({ page, request }) => {
    await login(page, { offlineConfig: { maxPendingMessages: 2 } });
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'queued one');
    await send(page, 'queued two');
    await send(page, 'over the cap');
    await expectRowState(page, 'over the cap', 'failed');
    await expect(notice(page, 'queue_full')).toBeVisible();
    await expectRowState(page, 'queued one', 'sending');
    await expectRowState(page, 'queued two', 'sending');
    expect(await optionIds(page, 'over the cap')).toEqual([OPTION.retry, OPTION.discard]);
    await chooseOption(page, 'over the cap', /^Delete$/);
    await confirmDelete(page);
    await expect(rowsWith(page, 'over the cap')).toHaveCount(0);
    await online(request);
    await expectRowSent(page, 'queued one');
    await expectRowSent(page, 'queued two');
    await expectNothingFor(page, 3_000, 'the deleted over-the-cap message is not sent once there is room');
    expect(await acceptedSends(request, 'over the cap')).toHaveLength(0);
  });

  test('queue full: Retry of the failed (direct) row is one fresh send once there is room (UIT-SEND-07/08)', async ({ page, request }) => {
    await login(page, { offlineConfig: { maxPendingMessages: 1 } });
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'fills the queue');
    await send(page, 'refused, retried later');
    await expectRowState(page, 'refused, retried later', 'failed');
    await online(request);
    await expectRowSent(page, 'fills the queue');
    await row(page, 'refused, retried later').locator('[data-testid="offline-retry"]').click();
    await expectRowSent(page, 'refused, retried later');
    await expectNothingFor(page, 3_000, 'a second send of the retried message would have reached the server by now');
    expect(await acceptedSends(request, 'refused, retried later')).toHaveLength(1);
    await expect(rowsWith(page, 'refused, retried later')).toHaveCount(1);
  });

  test('DISCARDED (DROP_OLDEST overflow): the dropped message disappears with one notice offering Copy; never Retry (UIT-SEND-13)', async ({ page, request }) => {
    await login(page, { offlineConfig: { maxPendingMessages: 2, pendingQueueOverflowPolicy: 'DROP_OLDEST' } });
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'oldest, dropped');
    await send(page, 'second, kept');
    await send(page, 'third, kept');
    await expect(rowsWith(page, 'oldest, dropped')).toHaveCount(0, { timeout: 15_000 });
    const removed = notice(page, 'unsent_message_removed');
    await expect(removed).toBeVisible();
    await expect(removed.getByRole('button', { name: /copy/i })).toBeVisible();
    await expectRowState(page, 'second, kept', 'sending');
    await expectRowState(page, 'third, kept', 'sending');
    await online(request);
    await expectRowSent(page, 'third, kept');
    await expectNothingFor(page, 3_000, 'the dropped message is never sent');
    expect(await acceptedSends(request, 'oldest, dropped')).toHaveLength(0);
  });
});

// ── Sends: order, duplicates, restarts ───────────────────────────────────────

test.describe('sends', () => {
  test('several queued sends go in compose order, once each, each row turning sent in place (UIT-SEND-03)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    const texts = ['in order 1', 'in order 2', 'in order 3'];
    for (const text of texts) await send(page, text);
    for (const text of texts) await expectRowState(page, text, 'sending');
    const keysBefore = await Promise.all(texts.map(t => row(page, t).getAttribute('data-cc-key')));
    await online(request);
    for (const text of texts) await expectRowSent(page, text);
    // Same render key from compose to ack: the row was replaced in place, not remounted.
    expect(await Promise.all(texts.map(t => row(page, t).getAttribute('data-cc-key')))).toEqual(keysBefore);
    const sends = await Promise.all(texts.map(t => acceptedSends(request, t)));
    expect(sends.map(s => s.length)).toEqual([1, 1, 1]);
    const order = sends.map(s => Number(s[0].seq));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('double-tap send sends one message (UIT-SEND-16)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    const input = composerInput(page);
    await input.click();
    await input.pressSequentially('tapped twice');
    await input.press('Enter');
    await input.press('Enter');
    await expectRowSent(page, 'tapped twice');
    await expectNothingFor(page, 2_000, 'the second Enter of the double tap would have sent by now');
    expect(await acceptedSends(request, 'tapped twice')).toHaveLength(1);
    await expect(rowsWith(page, 'tapped twice')).toHaveCount(1);
  });

  test('lost ack: never a duplicate of the local row (UIT-SEND-22)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    const since = await now(page);
    await control(request, '/fault', { match: { method: 'POST', path: '/messages' }, kind: 'dropResponse', times: 1 });
    await send(page, 'ack lost');
    await expectRowState(page, 'ack lost', 'sending');
    // With the socket up the send stays PENDING until the next reconnect (R94).
    await control(request, '/socket', { action: 'drop' });
    await expectRowSent(page, 'ack lost', 60_000);
    await expectNothingFor(page, 5_000, 'no duplicate row appears after the lost ack is resolved');
    // V1 accepts one server-side duplicate (BEH-SEND-23); the list shows no more rows than the server stored.
    const stored = (await acceptedSends(request, 'ack lost')).length + 1; // the dropped answer was still applied
    expect(await rowsWith(page, 'ack lost').count()).toBeLessThanOrEqual(stored);
    expectNoDuplicateKey(await frames(page, 'message-list', since));
  });

  test('a failed message is failed on the first frame after a restart, with Retry and Delete (UIT-SEND-05)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await control(request, '/fault', sendFault(503, 'ERR_SERVICE_UNAVAILABLE'));
    await send(page, 'failed before restart');
    await expectRowState(page, 'failed before restart', 'failed');
    await page.reload();
    const since = await now(page);
    await openChat(page, 'sam');
    await expectRowState(page, 'failed before restart', 'failed');
    const key = await row(page, 'failed before restart').getAttribute('data-cc-key');
    const first = (await frames(page, 'message-list', since)).find(f => f.rows.some(r => r.key === key));
    expect(first?.rows.find(r => r.key === key)?.state).toBe('failed');
    // After a restart the reason may be unknown (R95): treated as TRANSIENT.
    expect(await optionIds(page, 'failed before restart')).toEqual([OPTION.retry, OPTION.discard]);
    await clearFaults(request);
    await row(page, 'failed before restart').locator('[data-testid="offline-retry"]').click();
    await expectRowSent(page, 'failed before restart');
    expect(await acceptedSends(request, 'failed before restart')).toHaveLength(1);
  });

  test('a pending message sent offline shows its reply quote and is delivered as a reply (UIT-SEND-20)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await chooseOption(page, 'message 4', /reply/i);
    await send(page, 'replying offline');
    await expectRowState(page, 'replying offline', 'sending');
    await online(request);
    await expectRowSent(page, 'replying offline');
    const [sent] = await acceptedSends(request, 'replying offline');
    expect(JSON.stringify(sent.body)).toMatch(/quotedMessageId/);
  });
});

// ── Reads: two phases on every list ──────────────────────────────────────────

test.describe('reads', () => {
  test('online open: cached rows paint first and the server page replaces them in place, no duplicate, no flash (UIT-READ-01)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await page.reload();
    const since = await now(page);
    const seqBeforeOpen = await lastSeq(request);
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    // The server's page has replaced the cached rows; then watch the frames over a period where a flash or duplicate would show.
    await expectAnsweredRequest(request, seqBeforeOpen, r => r.method === 'GET' && r.path === '/users/sam/messages');
    await expectNothingFor(page, 1_500, 'no duplicate key or flash frame follows the server page');
    const list = await frames(page, 'message-list', since);
    expect(list.length).toBeGreaterThan(0);
    expectNoDuplicateKey(list);
    expectNoFlash(list);
    // No blank between two non-empty frames.
    const sizes = list.map(f => f.rows.length);
    const firstFull = sizes.findIndex(n => n > 0);
    expect(sizes.slice(firstFull).every(n => n > 0)).toBe(true);
  });

  test('offline open of a chat seen before: newest messages, no error screen, "Connect to load more" row that settles and loads by itself on reconnect (UIT-READ-02/04, D84)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await offline(request);
    await page.reload();
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await expect(page.locator('cometchat-message-list [data-testid="cc-error"]')).toHaveCount(0);
    await expect(page.locator('cometchat-message-list [data-testid="cc-list-footer"]')).toHaveAttribute('data-cc-footer', 'connect-to-load-more');
    // Settles: no loader left after the read.
    await expect(page.locator('cometchat-message-list .cometchat-message-list__shimmer, cometchat-message-list [aria-busy="true"]')).toHaveCount(0, { timeout: 10_000 });
    // Online again, the page behind the footer loads once by itself (D84 rule 9); nothing to tap.
    await online(request);
    await expect(page.locator('cometchat-message-list [data-testid="cc-list-footer"]')).toHaveCount(0, { timeout: 30_000 });
  });

  test('a chat opened online is saved: with the browser network off, reopening it shows its history', async ({ page, context }) => {
    await login(page);
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await context.setOffline(true);
    await openChat(page, 'bea');
    await openChat(page, 'sam');
    for (const text of ['message 1', 'message 2', 'message 3', 'message 4']) await expect(bubble(page, text)).toBeVisible();
    await expect(page.locator('cometchat-message-list [data-testid="cc-empty"]')).toHaveCount(0);
    await expect(page.locator('cometchat-message-list [data-testid="cc-error"]')).toHaveCount(0);
    await expect(page.locator('cometchat-message-list [data-testid="cc-list-footer"]')).toHaveAttribute('data-cc-footer', 'connect-to-load-more');
    await context.setOffline(false);
  });

  test('offline open of a chat never opened: "Connect to load messages" with no Retry, not the empty view or the footer; online, the chat loads by itself (D84)', async ({ page, request }) => {
    await login(page);
    await conversationsIdle(page);
    await offline(request);
    await openChat(page, 'bea');
    const state = page.locator('cometchat-message-list [data-testid="cc-empty"][data-cc-reason="connect-to-load"]');
    await expect(state).toBeVisible();
    await expect(state).toContainText('Connect to load messages');
    await expect(page.locator('cometchat-message-list [data-testid="cc-error"]')).toHaveCount(0);
    await expect(page.locator('cometchat-message-list [data-testid="cc-list-footer"]')).toHaveCount(0);
    await online(request);
    // The reconnect reads the first page once by itself; nothing to tap.
    await expect(bubble(page, 'message 1')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('cometchat-message-list [data-cc-reason="connect-to-load"]')).toHaveCount(0);
  });

  test('offline relaunch: the conversation list as last seen, with previews and unread counts (UIT-LIFE-07, UIT-CONV-01)', async ({ page, request }) => {
    await login(page);
    await conversationsIdle(page);
    const before = await page.locator('[data-testid="cc-conversation-row"]').evaluateAll(els => els.map(e => [e.getAttribute('data-cc-with'), e.getAttribute('data-cc-unread')]));
    await offline(request);
    await page.reload();
    await expect(conversationRow(page, 'sam')).toBeVisible({ timeout: 45_000 });
    const after = await page.locator('[data-testid="cc-conversation-row"]').evaluateAll(els => els.map(e => [e.getAttribute('data-cc-with'), e.getAttribute('data-cc-unread')]));
    expect(after).toEqual(before);
    await expect(page.locator('cometchat-conversations [data-testid="cc-error"]')).toHaveCount(0);
  });

  test('users and groups seen online are listed offline (UIT-LIST-01)', async ({ page, request }) => {
    await control(request, '/reset', { fixtures: { ...FIXTURES, groups: [{ guid: 'crew', members: ['alex', 'sam'] }] } });
    await login(page);
    await page.locator('#tab-users').click();
    await expect(page.locator('cometchat-users .cometchat-users__list-item-wrapper', { hasText: 'sam' }).first()).toBeVisible({ timeout: 30_000 });
    await page.locator('#tab-groups').click();
    await expect(page.locator('cometchat-groups', { hasText: /crew/i }).first()).toBeVisible({ timeout: 30_000 });
    await offline(request);
    await page.reload();
    await page.locator('#tab-users').click();
    await expect(page.locator('cometchat-users .cometchat-users__list-item-wrapper', { hasText: 'sam' }).first()).toBeVisible({ timeout: 30_000 });
    await page.locator('#tab-groups').click();
    await expect(page.locator('cometchat-groups', { hasText: /crew/i }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('a keyword search offline says "Connect to search" with its second line and fires no error; online, it runs again by itself (D84, UIT-LIST-02)', async ({ page, request }) => {
    await login(page);
    await conversationsIdle(page);
    await offline(request);
    await page.locator('cometchat-conversations cometchat-search-bar').first().click();
    const input = page.locator('cometchat-search [data-testid="search-input"]');
    await expect(input).toBeVisible();
    await input.fill('message');
    const state = page.locator('cometchat-search [data-testid="cc-empty"][data-cc-reason="connect-to-search"]').first();
    await expect(state).toBeVisible({ timeout: 15_000 });
    await expect(state).toContainText('Connect to search');
    await expect(state).toContainText('Search needs an internet connection.');
    await expect(page.locator('cometchat-search .cometchat-search__error-view-body-title')).toHaveCount(0);
    await online(request);
    await expect(page.locator('cometchat-search [data-cc-reason="connect-to-search"]')).toHaveCount(0, { timeout: 30_000 });
  });
});

// ── Reconnect and session ────────────────────────────────────────────────────

test.describe('reconnect and session', () => {
  test('reconnect: no list fetch of the kit\'s own; a queued send and the missed messages arrive once, in time order (UIT-SYNC-01/02/12)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await control(request, '/socket', { action: 'drop' });
    await send(page, 'mine while away');
    await control(request, '/fixtures', { messages: [{ with: 'sam', count: 2, from: 'peer', text: 'theirs while away' }], merge: true });
    const since = await lastSeq(request);
    await online(request);
    await expect(bubble(page, 'theirs while away 2')).toBeVisible({ timeout: 45_000 });
    await expectRowSent(page, 'mine while away');
    const after = (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > since);
    expect(after.filter(r => r.method === 'GET' && r.path === '/users/sam/messages')).toHaveLength(0);
    await expect(rowsWith(page, 'theirs while away 1')).toHaveCount(1);
    await expect(rowsWith(page, 'mine while away')).toHaveCount(1);
  });

  test('logout and login as another user: no frame of the first user\'s rows or chats (UIT-LIFE-01/02, UIT-LIFE-10)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'alex queued, then logged out');
    await online(request);
    await expectRowSent(page, 'alex queued, then logged out');
    await page.locator('.cometchat-selector__menu-button').first().click();
    await page.locator('.cometchat-selector__context-menu-item--danger').first().click();
    await expect(page.locator('#customUid')).toBeVisible({ timeout: 30_000 });
    const since = await now(page);
    await page.locator('#customUid').fill('bea');
    await page.locator('.cometchat-login__submit-button').click();
    await expect(page.locator('cometchat-conversations .cometchat-conversation-item').first()).toBeVisible({ timeout: 45_000 });
    await openChat(page, 'alex');
    const list = await frames(page, 'message-list', since);
    for (const frame of list) for (const r of frame.rows) expect(r.state).not.toBe('sending');
    await expect(conversationRow(page, 'bea')).toHaveCount(0);
  });

  test('cache reset with unsent messages lost: one notice with the count; lists reload (UIT-LIFE-05)', async ({ page, request }) => {
    await login(page, { offlineConfig: { encryption: true } });
    await openChat(page, 'sam');
    await offline(request);
    await send(page, 'lost one');
    await send(page, 'lost two');
    await expectRowState(page, 'lost two', 'sending');
    await loseCacheKey(page);
    await online(request);
    await control(request, '/socket', { action: 'refuse' }); // nothing may flush before the restart
    await page.reload();
    await control(request, '/socket', { action: 'accept' });
    const reset = page.locator('[data-testid="cc-notice"][data-cc-notice^="unsent_messages_"]');
    await expect(reset).toHaveCount(1, { timeout: 45_000 });
    await expect(conversationRow(page, 'sam')).toBeVisible({ timeout: 45_000 });
  });

  test('cache reset with nothing unsent: no notice (UIT-LIFE-06)', async ({ page, request }) => {
    await login(page, { offlineConfig: { encryption: true } });
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await loseCacheKey(page);
    await page.reload();
    await expect(conversationRow(page, 'sam')).toBeVisible({ timeout: 45_000 });
    await expectNothingFor(page, 5_000, 'a reset of an empty cache raises no notice');
    await expect(page.locator('[data-testid="cc-notice"]')).toHaveCount(0);
  });

  test('kill switch off mid-session: at the next connection event the stranded rows turn failed with one notice; Retry is one fresh send (UIT-LIFE-04)', async ({ page, request }) => {
    test.setTimeout(240_000);
    await login(page);
    await openChat(page, 'sam');
    // Hold every send so the rows stay un-acked while the socket stays up (the
    // SDK learns the switch from the settings-hash ping of a connected client).
    await control(request, '/fault', { match: { method: 'POST', path: '/messages' }, kind: 'noResponse', times: 'always' });
    await send(page, 'stranded one');
    await send(page, 'stranded two');
    await expectRowState(page, 'stranded two', 'sending');
    const mark = await control(request, '/mark', { name: 'killSwitch' });
    await control(request, '/settings', { parameters: { 'features.core.offline-support.enabled': 'false' } });
    // The SDK pings every 60 s; it refetches the settings when the hash is stale.
    await control(request, '/await/request', {
      match: { anyOf: [{ method: 'GET', path: '/settings' }, { method: 'GET', path: '/me' }, { method: 'PUT', path: '/me' }] },
      after: 'killSwitch', timeoutMs: 150_000,
    });
    // The SDK has the answer to its settings read, and applies it before the connection event below.
    await expectAnsweredRequest(request, mark.seq, r => (r.method === 'GET' && (r.path === '/settings' || r.path === '/me')) || (r.method === 'PUT' && r.path === '/me'));
    await clearFaults(request);
    await control(request, '/socket', { action: 'drop' }); // the next connection event
    await expectRowState(page, 'stranded two', 'failed', 60_000);
    await expect(notice(page, 'messages_not_sent')).toHaveCount(1);
    expect(await optionIds(page, 'stranded two')).toEqual([OPTION.retry, OPTION.discard]);
    const since = await lastSeq(request);
    await row(page, 'stranded two').locator('[data-testid="offline-retry"]').click();
    await expectRowSent(page, 'stranded two');
    expect(await acceptedSends(request, 'stranded two', since)).toHaveLength(1);
  });
});

// ── Own actions offline (UIK-MUT-01) ─────────────────────────────────────────

test.describe('own actions offline (UIT-MUT-01, UIT-SEND-19)', () => {
  test('editing a sent message offline: today\'s error, the message unchanged, nothing reaches the server', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await expect(bubble(page, 'message 4')).toBeVisible();
    await offline(request);
    await control(request, '/socket', { action: 'drop' });
    const since = await lastSeq(request);
    await chooseOption(page, 'message 4', /edit/i);
    const input = composerInput(page);
    await input.press('End');
    await input.pressSequentially(' edited offline');
    await input.press('Enter');
    await expectNothingFor(page, 3_000, 'an offline edit changes no row and reaches no server');
    await expect(rowsWith(page, 'edited offline')).toHaveCount(0);
    await expect(bubble(page, 'message 4')).toBeVisible();
    const edits = (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > since && r.method === 'PUT' && /^\/messages\/\d+$/.test(r.path) && r.outcome === 'answered');
    expect(edits).toHaveLength(0);
  });
});

// ── Media and the upload tray ────────────────────────────────────────────────

test.describe('media', () => {
  test('an own photo sent offline shows its local preview at once and sends on reconnect (UIT-MEDIA-03)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await offline(request);
    await dropFile(page, 'offline-photo.png', 'image/png', PNG_1PX);
    const photoRow = page.locator('[data-testid="cc-message-row"]', { has: page.locator('cometchat-image-bubble') }).last();
    await expect(photoRow).toHaveAttribute('data-cc-state', 'sending', { timeout: 15_000 });
    await expect(photoRow.locator('img[src^="blob:"]').first()).toBeVisible();
    await online(request);
    await expect(photoRow).toHaveAttribute('data-cc-state', /^(sent|delivered|read)$/, { timeout: 60_000 });
    await expect(page.locator('[data-testid="cc-message-row"]', { has: page.locator('cometchat-image-bubble') })).toHaveCount(1);
  });

  test('killed mid-upload: on reopen the tray shows the interrupted file failed with retry; nothing uploads by itself (UIT-UP-01)', async ({ page, request }) => {
    await login(page);
    await openChat(page, 'sam');
    await control(request, '/fault', { match: { method: 'POST', path: '/uploads/conformance-bucket' }, kind: 'noResponse', times: 'always' });
    await page.locator('cometchat-message-composer input.cometchat-message-composer__file-input').setInputFiles({ name: 'tray.png', mimeType: 'image/png', buffer: PNG_1PX });
    const tile = page.locator('[data-testid="cc-composer-tray-tile"]').first();
    await expect(tile).toHaveAttribute('data-cc-state', 'uploading', { timeout: 15_000 });
    await page.reload();
    await clearFaults(request);
    const since = await lastSeq(request);
    await openChat(page, 'sam');
    await expect(tile).toHaveAttribute('data-cc-state', 'failed', { timeout: 30_000 });
    await expectNothingFor(page, 3_000, 'an interrupted upload does not restart by itself');
    const uploads = (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > since && r.path === '/uploads/conformance-bucket');
    expect(uploads).toHaveLength(0);
  });
});

// ── Offline off: today's behaviour ───────────────────────────────────────────

test.describe('offline off (UIT-OFF)', () => {
  test('a failed send keeps today\'s menu: no Retry option, no device-only Delete, no offline database', async ({ page, request }) => {
    await login(page, { offline: false });
    await openChat(page, 'sam');
    await control(request, '/fault', sendFault(503, 'ERR_SERVICE_UNAVAILABLE'));
    await send(page, 'off failure');
    await expect(bubble(page, 'off failure').locator('.cometchat-receipts-error')).toBeVisible({ timeout: 30_000 });
    const ids = await optionIds(page, 'off failure');
    expect(ids).not.toContain(OPTION.retry);
    expect(ids).not.toContain(OPTION.discard);
    await expect(row(page, 'off failure').locator('[data-testid="offline-retry"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="cc-notice"]')).toHaveCount(0);
    expect((await databases(page)).filter(n => /^cometchat_offline_/.test(n ?? ''))).toEqual([]);
  });

  test('offline off: a reload with the network down shows no cached chat and no offline footer', async ({ page, request }) => {
    await login(page, { offline: false });
    await openChat(page, 'sam');
    await offline(request);
    await page.reload();
    await expect(conversationRow(page, 'sam')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-testid="cc-list-footer"]')).toHaveCount(0);
  });
});
