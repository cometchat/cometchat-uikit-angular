/**
 * Shared steps for the offline E2E specs (`playwright.offline.config.ts`).
 *
 * The sample app is built with `-c offline-e2e` and talks to the offline
 * conformance harness's fake CometChat server. The server's control plane
 * (`CONTROL`) takes the network down and up, injects faults, changes settings
 * and reports every request it received. Rows, menus, notices and tiles are
 * read through the kit's state-contract identifiers (`data-testid` +
 * `data-cc-*`, TEST-PLAN §3.3), never through message text alone.
 */
import { expect, Locator, Page, APIRequestContext } from '@playwright/test';
import { expectNothingFor } from '../helpers/wait';

/** Re-exported so the offline specs import every wait from one place. */
export { expectNothingFor };

export const CONTROL = 'http://127.0.0.1:48789';

/** alex (the user under test) has chats with sam and bea. */
export const FIXTURES = {
  users: ['alex', 'sam', 'bea'],
  conversations: [{ with: 'sam' }, { with: 'bea' }],
  messages: [
    { with: 'sam', count: 4, from: 'alternate' },
    { with: 'bea', count: 2, from: 'alternate' },
  ],
};

/** Message-list option ids (CometChatUIKitConstants.MessageOption). */
export const OPTION = {
  retry: 'retryMessage',
  discard: 'discardMessage',
  copy: 'copy',
  delete: 'delete',
  reply: 'reply',
  react: 'react',
};

export async function control(request: APIRequestContext, path: string, body: unknown): Promise<any> {
  const response = await request.post(`${CONTROL}${path}`, { data: body });
  expect(response.ok(), `control ${path} answered ${response.status()}`).toBeTruthy();
  return response.json().catch(() => ({}));
}

export async function clearFaults(request: APIRequestContext): Promise<void> {
  await request.delete(`${CONTROL}/fault`);
}

export async function serverRequests(request: APIRequestContext, query = ''): Promise<any[]> {
  const response = await request.get(`${CONTROL}/requests${query}`);
  const body = await response.json();
  return Array.isArray(body) ? body : body.requests ?? [];
}

/** Request-log sequence number of the newest request so far. */
export async function lastSeq(request: APIRequestContext): Promise<number> {
  return Math.max(0, ...(await serverRequests(request)).map(r => Number(r.seq) || 0));
}

/** Sends of `text` the server answered (stored), optionally after `since`. */
export async function acceptedSends(request: APIRequestContext, text: string, since = 0): Promise<any[]> {
  return (await serverRequests(request)).filter(r =>
    (Number(r.seq) || 0) > since && r.method === 'POST' && r.path === '/messages' && r.outcome === 'answered'
    && (r.status ?? 200) < 300 && JSON.stringify(r.body ?? '').includes(text));
}

/** The realtime sockets the fake server currently holds for the user under test (`GET /state`). */
export async function socketCount(request: APIRequestContext, uid = 'alex'): Promise<number> {
  const response = await request.get(`${CONTROL}/state`);
  const state = await response.json();
  return ((state.sockets ?? []) as Array<{ uid?: string }>).filter(s => s.uid === uid).length;
}

/** Wait until the page's realtime socket is connected (`up`) or gone (`!up`) on the server. */
export async function expectSocket(request: APIRequestContext, up: boolean, timeout = 45_000): Promise<void> {
  await expect.poll(async () => (await socketCount(request)) > 0, { timeout, message: `realtime socket ${up ? 'connected' : 'dropped'}` }).toBe(up);
}

/** Wait for the server to have answered a request matching `match` after request-log number `since`. */
export async function expectAnsweredRequest(request: APIRequestContext, since: number, match: (r: any) => boolean, timeout = 45_000): Promise<void> {
  await expect.poll(async () => (await serverRequests(request)).some(r =>
    (Number(r.seq) || 0) > since && r.outcome === 'answered' && match(r)), { timeout, message: 'the server answered the awaited request' }).toBe(true);
}

export async function offline(request: APIRequestContext): Promise<void> {
  await control(request, '/network', { state: 'offline' });
}

export async function online(request: APIRequestContext): Promise<void> {
  await control(request, '/network', { state: 'online' });
}

/**
 * Log in through the sample app. `query` picks the variant: `?offline=0` is the
 * offline-off run; `offlineConfig` adds SDK offline settings (the sample keeps
 * both for reloads in the same tab).
 */
export async function login(page: Page, options: { uid?: string; offline?: boolean; offlineConfig?: Record<string, unknown> } = {}): Promise<void> {
  const params = new URLSearchParams();
  if (options.offline === false) params.set('offline', '0');
  if (options.offlineConfig) params.set('offlineConfig', JSON.stringify(options.offlineConfig));
  const query = params.toString();
  await page.goto(`/login${query ? `?${query}` : ''}`);
  await page.locator('#customUid').fill(options.uid ?? 'alex');
  await page.locator('.cometchat-login__submit-button').click();
  await expect(page.locator('cometchat-conversations .cometchat-conversation-item').first()).toBeVisible({ timeout: 45_000 });
}

/** Wait until the conversation list is idle (it ignores clicks while loading, ENG-35029). */
export async function conversationsIdle(page: Page): Promise<void> {
  await expect(page.locator('cometchat-conversations .cometchat-paginated-list').first()).toHaveAttribute('aria-busy', 'false');
}

export async function openChat(page: Page, name: string): Promise<void> {
  await conversationsIdle(page);
  await page.locator('cometchat-conversations .cometchat-conversation-item', { hasText: name }).first().click();
  await expect(composerInput(page)).toBeVisible();
}

export function composerInput(page: Page): Locator {
  return page.locator('cometchat-message-composer [contenteditable="true"]').first();
}

export async function send(page: Page, text: string): Promise<void> {
  const input = composerInput(page);
  await input.click();
  await input.pressSequentially(text);
  await input.press('Enter');
}

export function bubble(page: Page, text: string): Locator {
  return page.locator('cometchat-message-bubble', { hasText: text }).last();
}

/** The state-contract row (`cc-message-row`) that shows `text`. */
export function row(page: Page, text: string): Locator {
  return page.locator('[data-testid="cc-message-row"]', { has: page.locator('cometchat-message-bubble', { hasText: text }) }).last();
}

export function rowsWith(page: Page, text: string): Locator {
  return page.locator('[data-testid="cc-message-row"]', { has: page.locator('cometchat-message-bubble', { hasText: text }) });
}

export async function expectRowState(page: Page, text: string, state: 'sending' | 'sent' | 'delivered' | 'read' | 'failed', timeout = 30_000): Promise<void> {
  await expect(row(page, text)).toHaveAttribute('data-cc-state', state, { timeout });
}

/** Wait for a sent state: sent, delivered or read. */
export async function expectRowSent(page: Page, text: string, timeout = 45_000): Promise<void> {
  await expect(row(page, text)).toHaveAttribute('data-cc-state', /^(sent|delivered|read)$/, { timeout });
}

/** The option ids the row's menu offers (`[]` when the row has no menu). */
export async function optionIds(page: Page, text: string): Promise<string[]> {
  const menu = row(page, text).locator('[data-testid="cc-message-options"]');
  if (await menu.count() === 0) return [];
  const ids = await menu.first().getAttribute('data-cc-options');
  return (ids ?? '').split(',').filter(Boolean);
}

/** Pick an option from the row's hover menu (quick items, then the "more" sub-menu). */
export async function chooseOption(page: Page, text: string, label: RegExp): Promise<void> {
  const target = bubble(page, text);
  await target.hover();
  const menu = target.locator('.cometchat-message-bubble__options');
  const quick = menu.locator('[role="menuitem"]:visible');
  for (let i = 0; i < await quick.count(); i++) {
    if (label.test((await quick.nth(i).getAttribute('aria-label')) || '')) { await quick.nth(i).dispatchEvent('click'); return; }
  }
  await menu.locator('.cometchat-menu-list__sub-menu:visible').first().click({ force: true });
  const sub = page.locator('.cometchat-menu-list__sub-menu-list:visible [role="menuitem"]');
  for (let i = 0; i < await sub.count(); i++) {
    const value = ((await sub.nth(i).getAttribute('aria-label')) || (await sub.nth(i).textContent()) || '').trim();
    if (label.test(value)) { await sub.nth(i).dispatchEvent('click'); return; }
  }
  throw new Error(`no option matching ${label}`);
}

/** Confirm today's delete dialog. */
export async function confirmDelete(page: Page): Promise<void> {
  const submit = page.locator('cometchat-message-list cometchat-confirm-dialog .cometchat-confirm-dialog__button-group-submit button, cometchat-message-list cometchat-confirm-dialog .cometchat-confirm-dialog__button-group-submit').first();
  await expect(submit).toBeVisible();
  await submit.click();
}

/** Notices the screen shows, by kind (`data-cc-notice`). */
export function notice(page: Page, kind: string): Locator {
  return page.locator(`[data-testid="cc-notice"][data-cc-notice="${kind}"]`);
}

/** The conversation row for a 1:1 chat, by its state-contract identifier. */
export function conversationRow(page: Page, uid: string): Locator {
  return page.locator(`cometchat-conversations [data-testid="cc-conversation-row"][data-cc-with="user:${uid}"]`);
}

/** Frames the sample app's frame probe recorded for one surface since `since` (performance.now()). */
export async function frames(page: Page, surface = 'message-list', since = 0): Promise<Array<{ at: number; rows: Array<{ key: string; id: string; state: string }> }>> {
  return page.evaluate(([s, t]) => ((globalThis as any).__ccFrames ?? []).filter((f: any) => f.surface === s && f.at >= (t as number)), [surface, since] as const);
}

export async function now(page: Page): Promise<number> {
  return page.evaluate(() => performance.now());
}

/** No frame shows two rows with one key or one server id (TEST-PLAN §3.4 noDuplicateKey). */
export function expectNoDuplicateKey(list: Array<{ rows: Array<{ key: string; id: string }> }>): void {
  for (const frame of list) {
    const keys = frame.rows.map(r => r.key);
    expect(new Set(keys).size, `duplicate key in ${JSON.stringify(keys)}`).toBe(keys.length);
    const ids = frame.rows.map(r => r.id).filter(Boolean);
    expect(new Set(ids).size, `duplicate server id in ${JSON.stringify(ids)}`).toBe(ids.length);
  }
}

/** A row visible in two frames is visible in every frame between (noFlash). */
export function expectNoFlash(list: Array<{ rows: Array<{ key: string }> }>): void {
  const seen = new Map<string, number[]>();
  list.forEach((frame, index) => frame.rows.forEach(r => { const at = seen.get(r.key) ?? []; at.push(index); seen.set(r.key, at); }));
  for (const [key, at] of seen) {
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1], `row ${key} flashed out between frames ${at[i - 1]} and ${at[i]}`).toBe(1);
  }
}

/** A 1x1 PNG. */
export const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

/** Drop a file on the composer (its drag-and-drop send path). */
export async function dropFile(page: Page, name: string, mimeType: string, bytes: Buffer): Promise<void> {
  const dataTransfer = await page.evaluateHandle(([fileName, type, data]) => {
    const transfer = new DataTransfer();
    const raw = Uint8Array.from(atob(data as string), c => c.charCodeAt(0));
    transfer.items.add(new File([raw], fileName as string, { type: type as string }));
    return transfer;
  }, [name, mimeType, bytes.toString('base64')] as const);
  const target = page.locator('cometchat-message-composer .cometchat-message-composer').first();
  await target.dispatchEvent('dragenter', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await target.dispatchEvent('drop', { dataTransfer });
}

/** Names of the IndexedDB databases the page's origin holds. */
export async function databases(page: Page): Promise<string[]> {
  return page.evaluate(async () => (indexedDB as any).databases ? (await (indexedDB as any).databases()).map((d: any) => d.name) : []);
}

/**
 * Delete the cache's sealed key (`device: keyLost`): the JS SDK keeps it in
 * the same IndexedDB as the rows (`crypto_keys`, id `primary`), so the next
 * start cannot read the cache and resets it.
 */
export async function loseCacheKey(page: Page, appId = 'app1', uid = 'alex'): Promise<void> {
  await page.evaluate(([app, user]) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open(`cometchat_offline_${app}_${user}`);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('crypto_keys')) { db.close(); reject(new Error('no crypto_keys store: encryption is off')); return; }
      const tx = db.transaction('crypto_keys', 'readwrite');
      tx.objectStore('crypto_keys').clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }), [appId, uid] as const);
}
