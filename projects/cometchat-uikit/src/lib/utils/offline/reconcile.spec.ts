/** Pure list operations of the offline path: sorted upsert, windowed reconcile, held receipts. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { serverIdOf } from './identity';
import {
  cachedKeysOf,
  compareRows,
  dropUnjoinedCachedPage,
  findRowIndex,
  HeldReceipts,
  isNotConnectedError,
  newestServerId,
  oldestServerId,
  reconcileServerPage,
  removeRow,
  upsertSorted,
} from './reconcile';

const sent = (id: number, extra: Parameters<typeof offlineMessage>[1] = {}) =>
  offlineMessage(textMessage(`m${id}`), { id, sentAt: id * 10, ...extra });
const ids = (rows: readonly CometChat.BaseMessage[]) => rows.map(serverIdOf);

describe('isNotConnectedError', () => {
  it('recognises the not-connected terminals by code or name', () => {
    for (const code of ['FAILED_TO_FETCH', 'ERROR_INTERNET_UNAVAILABLE', 'NO_WEBSOCKET_CONNECTION', 'NOT_CONNECTED']) {
      expect(isNotConnectedError({ code })).toBe(true);
    }
    expect(isNotConnectedError({ name: 'FAILED_TO_FETCH' })).toBe(true);
    expect(isNotConnectedError({ code: 'ERR_OTHER' })).toBe(false);
    expect(isNotConnectedError(null)).toBe(false);
  });
});

describe('row order and identity', () => {
  it('sent rows sort by (sentAt, id) and unsent rows come last', () => {
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L', sentAt: 1 });
    expect(compareRows(sent(1), sent(2))).toBeLessThan(0);
    expect(compareRows(sent(2), unsent)).toBeLessThan(0);
    expect(compareRows(unsent, sent(2))).toBeGreaterThan(0);
  });

  it('findRowIndex matches by server id, then local handle, then muid', () => {
    const rows = [sent(1), offlineMessage(textMessage('u'), { localMessageId: 'L', muid: 'M' })];
    expect(findRowIndex(rows, sent(1))).toBe(0);
    expect(findRowIndex(rows, offlineMessage(textMessage('x'), { id: 9, localMessageId: 'L' }))).toBe(1);
    expect(findRowIndex(rows, offlineMessage(textMessage('x'), { muid: 'M' }))).toBe(1);
    expect(findRowIndex(rows, sent(99))).toBe(-1);
  });

  it('newestServerId and oldestServerId skip rows with no server id', () => {
    const rows = [offlineMessage(textMessage('u'), { localMessageId: 'L' }), sent(3), sent(5), offlineMessage(textMessage('v'), { localMessageId: 'M' })];
    expect(oldestServerId(rows)).toBe(3);
    expect(newestServerId(rows)).toBe(5);
    expect(newestServerId([])).toBe(0);
  });
});

describe('upsertSorted', () => {
  it('puts each message in its sorted place and reports a change', () => {
    const result = upsertSorted([sent(1), sent(3)], [sent(2)]);
    expect(result.changed).toBe(true);
    expect(ids(result.rows)).toEqual([1, 2, 3]);
  });

  it('keeps the newer copy of the same server row, so a read never reverts a live edit', () => {
    const live = sent(2, { updatedAt: 50 });
    const stale = sent(2, { updatedAt: 10 });
    const result = upsertSorted([live], [stale]);
    expect(result.changed).toBe(false);
    expect(result.rows[0]).toBe(live);
  });

  it('replaces a row with a newer copy and leaves an identical one alone', () => {
    const old = sent(2, { updatedAt: 10 });
    const fresh = sent(2, { updatedAt: 20 });
    expect(upsertSorted([old], [fresh]).rows[0]).toBe(fresh);
    expect(upsertSorted([old], [old]).changed).toBe(false);
  });
});

describe('reconcileServerPage', () => {
  it('drops a cached row the server page proves gone, inside its id range only', () => {
    const rows = [sent(1), sent(2), sent(3), sent(4)];
    const cached = cachedKeysOf(rows);
    const result = reconcileServerPage(rows, cached, [sent(2), sent(4)]);
    expect(ids(result.rows)).toEqual([1, 2, 4]);
    expect(result.changed).toBe(true);
  });

  it('never removes a row with no server id', () => {
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L' });
    const rows = [sent(2), unsent];
    const result = reconcileServerPage(rows, cachedKeysOf(rows), [sent(2)]);
    expect(result.rows).toContain(unsent);
  });
});

describe('dropUnjoinedCachedPage', () => {
  it('keeps a cached page that shares a row with the server page', () => {
    const rows = [sent(1), sent(2), sent(3)];
    const cached = cachedKeysOf(rows.slice(0, 2));
    const result = dropUnjoinedCachedPage(rows, cached, cached, [sent(2), sent(3)], 'previous');
    expect(result.changed).toBe(false);
  });

  it('drops the painted rows beyond the server page when the two do not join', () => {
    const rows = [sent(1), sent(2), sent(8), sent(9)];
    const painted = cachedKeysOf([sent(1), sent(2)]);
    const result = dropUnjoinedCachedPage(rows, painted, painted, [sent(8), sent(9)], 'previous');
    expect(ids(result.rows)).toEqual([8, 9]);
  });
});

describe('removeRow', () => {
  it('removes the row that is the message, or reports no change', () => {
    const rows = [sent(1), sent(2)];
    expect(ids(removeRow(rows, sent(1)).rows)).toEqual([2]);
    expect(removeRow(rows, sent(7)).changed).toBe(false);
  });
});

describe('HeldReceipts', () => {
  const receipt = (n: number) => ({ n }) as unknown as CometChat.MessageReceipt;

  it('holds a receipt for an unseen server id and gives it back once', () => {
    const held = new HeldReceipts();
    held.hold(5, receipt(1));
    expect(held.size).toBe(1);
    expect(held.take(5)).toEqual({ n: 1 });
    expect(held.take(5)).toBeUndefined();
  });

  it('ignores a non-positive id and caps what it holds, dropping the oldest', () => {
    const held = new HeldReceipts();
    held.hold(0, receipt(0));
    expect(held.size).toBe(0);
    for (let id = 1; id <= 201; id++) held.hold(id, receipt(id));
    expect(held.size).toBe(200);
    expect(held.take(1)).toBeUndefined();
    expect(held.take(201)).toBeDefined();
    held.clear();
    expect(held.size).toBe(0);
  });
});
