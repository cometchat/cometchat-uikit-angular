/**
 * Pure list operations for the offline (ON) path: sorted upsert by identity,
 * the windowed reconcile of a server page against its cached page, and the
 * held-receipt map. Nothing here runs with offline off.
 *
 * Order: sent rows by `(sentAt, id)`; rows without a server id last, by compose
 * time (BEH-READ-10). A row without a server id is never removed by a read
 * (BEH-READ-30).
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { localIdOf, muidOf, rowKey, serverIdOf } from './identity';

/** The not-connected terminal of an offline read. */
export function isNotConnectedError(error: unknown): boolean {
  const code = (error as any)?.code ?? (error as any)?.name;
  return (
    code === 'FAILED_TO_FETCH' ||
    code === 'ERROR_INTERNET_UNAVAILABLE' ||
    code === 'NO_WEBSOCKET_CONNECTION' ||
    code === 'NOT_CONNECTED'
  );
}

function sentAtOf(message: CometChat.BaseMessage): number {
  const value = Number((message as any)?.getSentAt?.());
  return Number.isFinite(value) ? value : 0;
}

function updatedAtOf(message: CometChat.BaseMessage): number {
  const value = Number((message as any)?.getUpdatedAt?.());
  return Number.isFinite(value) ? value : 0;
}

/** Sort comparator: sent rows by (sentAt, id), then unsent rows by compose time. */
export function compareRows(a: CometChat.BaseMessage, b: CometChat.BaseMessage): number {
  const aId = serverIdOf(a);
  const bId = serverIdOf(b);
  if (aId > 0 !== bId > 0) return aId > 0 ? -1 : 1;
  const bySentAt = sentAtOf(a) - sentAtOf(b);
  if (bySentAt !== 0) return bySentAt;
  return aId - bId;
}

/**
 * Index of the row that is the same message as `message`: server id first,
 * then the local handle, then the muid.
 */
export function findRowIndex(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): number {
  const id = serverIdOf(message);
  if (id > 0) {
    const byId = rows.findIndex(row => serverIdOf(row) === id);
    if (byId !== -1) return byId;
  }
  const local = localIdOf(message);
  if (local) {
    const byLocal = rows.findIndex(row => localIdOf(row) === local);
    if (byLocal !== -1) return byLocal;
  }
  const muid = muidOf(message);
  if (muid) {
    const byMuid = rows.findIndex(
      row => muidOf(row) === muid && (serverIdOf(row) === 0 || id === 0 || serverIdOf(row) === id)
    );
    if (byMuid !== -1) return byMuid;
  }
  return -1;
}

/** Index at which `message` belongs in the sorted `rows`. */
function sortedIndex(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): number {
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (compareRows(rows[mid], message) <= 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

export interface UpsertResult {
  rows: CometChat.BaseMessage[];
  changed: boolean;
}

/**
 * Upsert `incoming` into `rows` by identity, each into its sorted place. For
 * the same server id the copy with the newer `updatedAt` wins, so a read never
 * reverts a live edit. Returns a new array; unchanged rows keep their objects.
 */
export function upsertSorted(
  rows: readonly CometChat.BaseMessage[],
  incoming: readonly CometChat.BaseMessage[]
): UpsertResult {
  const next = rows.slice();
  let changed = false;
  for (const message of incoming) {
    if (!message) continue;
    const index = findRowIndex(next, message);
    if (index !== -1) {
      const existing = next[index];
      if (existing === message) continue;
      const sameServerRow =
        serverIdOf(existing) > 0 && serverIdOf(existing) === serverIdOf(message);
      if (sameServerRow && updatedAtOf(existing) > updatedAtOf(message)) continue;
      next.splice(index, 1);
      next.splice(sortedIndex(next, message), 0, message);
      changed = true;
      continue;
    }
    next.splice(sortedIndex(next, message), 0, message);
    changed = true;
  }
  return { rows: changed ? next : (rows as CometChat.BaseMessage[]), changed };
}

/** Server-id keys of the rows a cached page showed. */
export function cachedKeysOf(messages: readonly CometChat.BaseMessage[]): Set<string> {
  const keys = new Set<string>();
  for (const message of messages) {
    if (serverIdOf(message) > 0) keys.add(rowKey(message));
  }
  return keys;
}

/**
 * Apply a server page: upsert it, then remove rows its cached page showed that
 * the server no longer has, but only inside the server page's id range (a
 * proven omission). Rows without a server id are never removed.
 *
 * `rawPage` is what the server returned when the list filters on the client and
 * `serverPage` holds only the rows it shows: a filtered-out row still proves its
 * neighbours exist, so omission is always judged against the raw page.
 */
export function reconcileServerPage(
  rows: readonly CometChat.BaseMessage[],
  cachedKeys: ReadonlySet<string>,
  serverPage: readonly CometChat.BaseMessage[],
  rawPage: readonly CometChat.BaseMessage[] = serverPage
): UpsertResult {
  const upserted = upsertSorted(rows, serverPage);
  const serverIds = rawPage.map(serverIdOf).filter(id => id > 0);
  if (serverIds.length === 0 || cachedKeys.size === 0) return upserted;
  const minId = Math.min(...serverIds);
  const maxId = Math.max(...serverIds);
  const serverKeys = new Set(rawPage.map(rowKey));
  const kept = upserted.rows.filter(row => {
    const id = serverIdOf(row);
    if (id === 0) return true;
    const key = rowKey(row);
    if (!cachedKeys.has(key) || serverKeys.has(key)) return true;
    return id < minId || id > maxId;
  });
  if (kept.length === upserted.rows.length) return upserted;
  return { rows: kept, changed: true };
}

/**
 * D13-R2: a cached page is shown, but kept only when it joins the server page
 * that answered the same read (the two share a row). One that does not join is
 * stale: more arrived while the app was away than one page holds, so its rows
 * sit an unknown distance from the server page. The rows it painted beyond the
 * server page's far end (older for `previous`, newer for `next`) are dropped
 * rather than stitched to it over a hidden gap; the next page reads them again
 * from the server page's edge. `paintedKeys` are the rows this cached page
 * added to the list (rows already listed are never touched), `rawCachedKeys`
 * every row of the cached page (filtered-out ones still prove a join), and
 * `rawPage` the server page before any client filter. Rows without a server id
 * are never removed.
 */
export function dropUnjoinedCachedPage(
  rows: readonly CometChat.BaseMessage[],
  paintedKeys: ReadonlySet<string>,
  rawCachedKeys: ReadonlySet<string>,
  rawPage: readonly CometChat.BaseMessage[],
  direction: 'previous' | 'next'
): UpsertResult {
  const unchanged = { rows: rows as CometChat.BaseMessage[], changed: false };
  if (paintedKeys.size === 0) return unchanged;
  const serverIds = rawPage.map(serverIdOf).filter(id => id > 0);
  if (serverIds.length === 0) return unchanged;
  const serverKeys = cachedKeysOf(rawPage);
  for (const key of rawCachedKeys) if (serverKeys.has(key)) return unchanged;
  const minId = Math.min(...serverIds);
  const maxId = Math.max(...serverIds);
  const kept = rows.filter(row => {
    const id = serverIdOf(row);
    if (id === 0 || !paintedKeys.has(rowKey(row))) return true;
    return direction === 'previous' ? id > minId : id < maxId;
  });
  if (kept.length === rows.length) return unchanged;
  return { rows: kept, changed: true };
}

/** Remove the row that is `message`, by identity. */
export function removeRow(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): UpsertResult {
  const index = findRowIndex(rows, message);
  if (index === -1) return { rows: rows as CometChat.BaseMessage[], changed: false };
  const next = rows.slice();
  next.splice(index, 1);
  return { rows: next, changed: true };
}

/** Newest row that has a server id: the cursor anchor (rows without one are skipped). */
export function newestServerId(rows: readonly CometChat.BaseMessage[]): number {
  for (let i = rows.length - 1; i >= 0; i--) {
    const id = serverIdOf(rows[i]);
    if (id > 0) return id;
  }
  return 0;
}

/** Oldest row that has a server id. */
export function oldestServerId(rows: readonly CometChat.BaseMessage[]): number {
  for (const row of rows) {
    const id = serverIdOf(row);
    if (id > 0) return id;
  }
  return 0;
}

const MAX_HELD_RECEIPTS = 200;

/**
 * Receipts for server ids the list does not show yet (their ack has not landed)
 * are held here and applied when a row acquires that id (BEH-SEND-32).
 */
export class HeldReceipts {
  private readonly held = new Map<number, CometChat.MessageReceipt>();

  hold(messageId: number, receipt: CometChat.MessageReceipt): void {
    if (!(messageId > 0)) return;
    this.held.delete(messageId);
    this.held.set(messageId, receipt);
    if (this.held.size > MAX_HELD_RECEIPTS) {
      const oldest = this.held.keys().next().value;
      if (oldest !== undefined) this.held.delete(oldest);
    }
  }

  /** Remove and return the receipt held for `messageId`, if any. */
  take(messageId: number): CometChat.MessageReceipt | undefined {
    const receipt = this.held.get(messageId);
    if (receipt) this.held.delete(messageId);
    return receipt;
  }

  clear(): void {
    this.held.clear();
  }

  get size(): number {
    return this.held.size;
  }
}
