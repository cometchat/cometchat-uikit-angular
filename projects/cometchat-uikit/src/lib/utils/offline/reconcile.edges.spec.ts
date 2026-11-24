/** Edges of the pure list operations: rows with no usable time, ties, held receipts past their limit. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { serverIdOf } from './identity';
import {
  cachedKeysOf,
  compareRows,
  dropUnjoinedCachedPage,
  HeldReceipts,
  isNotConnectedError,
  reconcileServerPage,
  removeRow,
  upsertSorted,
} from './reconcile';

const sent = (id: number, extra: Parameters<typeof offlineMessage>[1] = {}) =>
  offlineMessage(textMessage(`m${id}`), { id, sentAt: id * 10, ...extra });
const ids = (rows: readonly CometChat.BaseMessage[]) => rows.map(serverIdOf);

describe('compareRows: a row with no usable time', () => {
  it('a sent time that is not a number counts as zero, and the lower id comes first on a tie', () => {
    const a = sent(1);
    const b = sent(2);
    (a as any).getSentAt = () => 'later';
    (b as any).getSentAt = () => undefined;
    expect(compareRows(a, b)).toBeLessThan(0);
    expect(compareRows(b, a)).toBeGreaterThan(0);
  });

  it('an object with no time getters at all sorts by id', () => {
    const a: any = { getId: () => 5 };
    const b: any = { getId: () => 9 };
    expect(Math.sign(compareRows(a, b))).toBe(-1);
  });
});

describe('upsertSorted: the newer copy wins', () => {
  it('a copy with an update time that is not a number is replaced by a copy that has one', () => {
    const existing = sent(3);
    (existing as any).getUpdatedAt = () => 'never';
    const incoming = sent(3, { updatedAt: 50 });
    const result = upsertSorted([existing], [incoming]);
    expect(result.changed).toBe(true);
    expect(result.rows[0]).toBe(incoming);
  });

  it('an older copy of the same message does not revert a newer one', () => {
    const existing = sent(3, { updatedAt: 90 });
    const stale = sent(3, { updatedAt: 40 });
    const result = upsertSorted([existing], [stale]);
    expect(result.changed).toBe(false);
    expect(result.rows[0]).toBe(existing);
  });

  it('an empty entry in the incoming list is skipped', () => {
    const row = sent(1);
    const result = upsertSorted([row], [null as any, undefined as any]);
    expect(result.changed).toBe(false);
  });
});

describe('reconcileServerPage and dropUnjoinedCachedPage: nothing to reconcile', () => {
  it('a server page with no server ids, or no cached rows, only upserts', () => {
    const cachedRow = sent(1);
    const unsent = offlineMessage(textMessage('draft'), { localMessageId: 'L1', status: 'pending' });
    const noIds = reconcileServerPage([cachedRow], new Set(['1']), [unsent], [unsent]);
    expect(noIds.rows).toContain(cachedRow);
    const noCache = reconcileServerPage([cachedRow], new Set(), [sent(2)]);
    expect(ids(noCache.rows)).toEqual([1, 2]);
  });

  it('dropUnjoinedCachedPage: nothing painted, or a page with no server ids, changes nothing', () => {
    const rows = [sent(1), sent(2)];
    expect(dropUnjoinedCachedPage(rows, new Set(), new Set(['1']), [sent(5)], 'next').changed).toBe(false);
    const unsent = offlineMessage(textMessage('draft'), { localMessageId: 'L1', status: 'pending' });
    expect(dropUnjoinedCachedPage(rows, cachedKeysOf(rows), cachedKeysOf(rows), [unsent], 'next').changed).toBe(false);
  });

  it('dropUnjoinedCachedPage: a painted row on the far side of the server page goes, in each direction', () => {
    const rows = [sent(1), sent(2), sent(20)];
    const painted = cachedKeysOf(rows);
    const rawCached = cachedKeysOf([rows[0], rows[1]]);
    const previous = dropUnjoinedCachedPage(rows, painted, rawCached, [sent(10), sent(11)], 'previous');
    expect(ids(previous.rows)).toEqual([20]);
    const next = dropUnjoinedCachedPage(rows, painted, rawCached, [sent(10), sent(11)], 'next');
    expect(ids(next.rows)).toEqual([1, 2]);
    const joined = dropUnjoinedCachedPage(rows, painted, rawCached, [sent(2), sent(3)], 'next');
    expect(joined.changed).toBe(false);
  });

  it('removeRow: a message that is not listed leaves the rows as they were', () => {
    const rows = [sent(1)];
    const result = removeRow(rows, sent(99));
    expect(result.changed).toBe(false);
    expect(result.rows).toBe(rows);
  });
});

describe('isNotConnectedError', () => {
  it('nothing, a string and an object with no code are not a not-connected error', () => {
    expect(isNotConnectedError(undefined)).toBe(false);
    expect(isNotConnectedError('FAILED_TO_FETCH')).toBe(false);
    expect(isNotConnectedError({})).toBe(false);
  });
});

describe('HeldReceipts', () => {
  const receipt = (id: number) => ({ id }) as any;

  it('keeps the newest receipts and drops the oldest past its limit', () => {
    const held = new HeldReceipts();
    for (let id = 1; id <= 600; id++) held.hold(id, receipt(id));
    expect(held.size).toBeLessThan(600);
    expect(held.take(1)).toBeUndefined();
    expect(held.take(600)).toEqual(receipt(600));
  });

  it('ignores a message id that is not positive, replaces a receipt held twice, and clears', () => {
    const held = new HeldReceipts();
    held.hold(0, receipt(0));
    held.hold(-4, receipt(-4));
    expect(held.size).toBe(0);
    held.hold(7, receipt(1));
    held.hold(7, receipt(2));
    expect(held.size).toBe(1);
    expect(held.take(7)).toEqual(receipt(2));
    expect(held.take(7)).toBeUndefined();
    held.hold(8, receipt(8));
    held.clear();
    expect(held.size).toBe(0);
  });
});
