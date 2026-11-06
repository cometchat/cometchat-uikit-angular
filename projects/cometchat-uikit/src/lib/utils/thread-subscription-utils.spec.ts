/**
 * Thread subscription helpers Tests
 *
 * Covers: id normalization, defensive flag reads/writes, reply → parent
 * targeting, and stamping a flip across a held message set.
 *
 * @module utils/thread-subscription-utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  toThreadId,
  readThreadSubscribed,
  writeThreadSubscribed,
  getSubscriptionTargetId,
  stampThreadSubscription,
} from './thread-subscription-utils';

/** A message stub with a real, stateful subscription flag. */
function makeMessage(id: unknown, parentId: unknown = 0, subscribed = false) {
  let flag = subscribed;
  return {
    getId: () => id,
    getParentMessageId: () => parentId,
    isThreadSubscribed: () => flag,
    setThreadSubscribed: vi.fn((v: boolean) => {
      flag = v;
    }),
  } as unknown as CometChat.BaseMessage & { setThreadSubscribed: ReturnType<typeof vi.fn> };
}

describe('toThreadId', () => {
  it('passes a positive number through', () => {
    expect(toThreadId(42)).toBe(42);
  });

  it('parses a numeric string', () => {
    expect(toThreadId('42')).toBe(42);
  });

  it('returns 0 for zero and negatives', () => {
    expect(toThreadId(0)).toBe(0);
    expect(toThreadId(-5)).toBe(0);
    expect(toThreadId('-5')).toBe(0);
  });

  it('returns 0 for non-numeric and non-finite input', () => {
    expect(toThreadId('abc')).toBe(0);
    expect(toThreadId(NaN)).toBe(0);
    expect(toThreadId(Infinity)).toBe(0);
    expect(toThreadId(undefined)).toBe(0);
    expect(toThreadId({})).toBe(0);
  });

  it('treats null and empty string as 0', () => {
    expect(toThreadId(null)).toBe(0);
    expect(toThreadId('')).toBe(0);
  });
});

describe('readThreadSubscribed', () => {
  it('returns the flag the message reports', () => {
    expect(readThreadSubscribed(makeMessage(1, 0, true))).toBe(true);
    expect(readThreadSubscribed(makeMessage(1, 0, false))).toBe(false);
  });

  it('returns false for null / undefined', () => {
    expect(readThreadSubscribed(null)).toBe(false);
    expect(readThreadSubscribed(undefined)).toBe(false);
  });

  it('returns false when the accessor is missing', () => {
    expect(readThreadSubscribed({ getId: () => 1 } as unknown as CometChat.BaseMessage)).toBe(false);
  });

  it('coerces a truthy non-boolean return to true', () => {
    const msg = { isThreadSubscribed: () => 1 } as unknown as CometChat.BaseMessage;
    expect(readThreadSubscribed(msg)).toBe(true);
  });
});

describe('writeThreadSubscribed', () => {
  it('sets the flag through the SDK setter', () => {
    const msg = makeMessage(1);
    writeThreadSubscribed(msg, true);
    expect(msg.setThreadSubscribed).toHaveBeenCalledWith(true);
    expect(readThreadSubscribed(msg)).toBe(true);
  });

  it('is a no-op without a setter and does not throw', () => {
    const msg = { getId: () => 1 } as unknown as CometChat.BaseMessage;
    expect(() => writeThreadSubscribed(msg, true)).not.toThrow();
    expect(readThreadSubscribed(msg)).toBe(false);
  });

  it('is a no-op on null / undefined', () => {
    expect(() => writeThreadSubscribed(null, true)).not.toThrow();
    expect(() => writeThreadSubscribed(undefined, false)).not.toThrow();
  });
});

describe('getSubscriptionTargetId', () => {
  it('targets the message itself when it is top-level', () => {
    expect(getSubscriptionTargetId(makeMessage(10, 0))).toBe(10);
  });

  it('targets the parent when the message is a reply, never the reply id', () => {
    expect(getSubscriptionTargetId(makeMessage(11, 10))).toBe(10);
  });

  it('normalizes string ids', () => {
    expect(getSubscriptionTargetId(makeMessage('11', '10'))).toBe(10);
    expect(getSubscriptionTargetId(makeMessage('12', undefined))).toBe(12);
  });

  it('returns 0 for a partial message with no accessors', () => {
    expect(getSubscriptionTargetId({} as CometChat.BaseMessage)).toBe(0);
  });

  it('returns 0 for null without throwing', () => {
    expect(getSubscriptionTargetId(null as unknown as CometChat.BaseMessage)).toBe(0);
  });

  it('falls back to the own id when only getId exists', () => {
    expect(getSubscriptionTargetId({ getId: () => 7 } as unknown as CometChat.BaseMessage)).toBe(7);
  });
});

describe('stampThreadSubscription', () => {
  it('stamps the parent and its replies but not other threads', () => {
    const parent = makeMessage(100, 0);
    const reply1 = makeMessage(101, 100);
    const reply2 = makeMessage(102, '100');
    const otherRoot = makeMessage(200, 0);
    const otherReply = makeMessage(201, 200);

    stampThreadSubscription([parent, reply1, reply2, otherRoot, otherReply], 100, true);

    expect(readThreadSubscribed(parent)).toBe(true);
    expect(readThreadSubscribed(reply1)).toBe(true);
    expect(readThreadSubscribed(reply2)).toBe(true);
    expect(readThreadSubscribed(otherRoot)).toBe(false);
    expect(readThreadSubscribed(otherReply)).toBe(false);
  });

  it('can flip a subscribed thread back to unsubscribed', () => {
    const parent = makeMessage(5, 0, true);
    stampThreadSubscription([parent], 5, false);
    expect(readThreadSubscribed(parent)).toBe(false);
  });

  it('accepts a string parent id', () => {
    const parent = makeMessage(5, 0);
    stampThreadSubscription([parent], '5' as unknown as number, true);
    expect(readThreadSubscribed(parent)).toBe(true);
  });

  it('skips null / undefined entries', () => {
    const parent = makeMessage(5, 0);
    expect(() => stampThreadSubscription([null, undefined, parent], 5, true)).not.toThrow();
    expect(readThreadSubscribed(parent)).toBe(true);
  });

  it('does nothing for an invalid thread id', () => {
    const msg = makeMessage(0, 0);
    stampThreadSubscription([msg], 0, true);
    stampThreadSubscription([msg], -1, true);
    expect(msg.setThreadSubscribed).not.toHaveBeenCalled();
  });

  it('works with any iterable, e.g. a Map\'s values', () => {
    const a = makeMessage(9, 0);
    const b = makeMessage(10, 9);
    const map = new Map([
      ['a', a],
      ['b', b],
    ]);
    stampThreadSubscription(map.values(), 9, true);
    expect(readThreadSubscribed(a)).toBe(true);
    expect(readThreadSubscribed(b)).toBe(true);
  });
});
