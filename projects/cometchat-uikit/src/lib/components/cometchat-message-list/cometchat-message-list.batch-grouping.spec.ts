/**
 * P2-U1 — batchId grouping in the message list. Tests the pure helpers that decide,
 * for a run of consecutive messages sharing metadata.batchId, which is first
 * (avatar/name) and which is last (time/receipt).
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeBatchFlagsImpl,
  getBatchIdImpl,
} from './cometchat-message-list.message-state';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function msg(batchId?: string | null): CometChat.BaseMessage {
  return {
    getMetadata: () => (batchId ? { batchId } : {}),
  } as unknown as CometChat.BaseMessage;
}

describe('getBatchIdImpl', () => {
  it('reads a non-empty string batchId from metadata, else null', () => {
    expect(getBatchIdImpl(msg('b1'))).toBe('b1');
    expect(getBatchIdImpl(msg())).toBeNull();
    expect(getBatchIdImpl(msg(''))).toBeNull();
  });
});

describe('computeBatchFlagsImpl', () => {
  function flags(list: (string | undefined)[]) {
    const messages = list.map((b) => msg(b));
    const map = computeBatchFlagsImpl(messages);
    return messages.map((m) => map.get(m));
  }

  it('messages without a batchId are their own group (first & last)', () => {
    expect(flags([undefined, undefined])).toEqual([
      { isFirstInBatch: true, isLastInBatch: true },
      { isFirstInBatch: true, isLastInBatch: true },
    ]);
  });

  it('a run of the same batchId: first is first, last is last, middle is neither', () => {
    const f = flags(['b', 'b', 'b']);
    expect(f[0]).toEqual({ isFirstInBatch: true, isLastInBatch: false });
    expect(f[1]).toEqual({ isFirstInBatch: false, isLastInBatch: false });
    expect(f[2]).toEqual({ isFirstInBatch: false, isLastInBatch: true });
  });

  it('adjacent different batches split at the boundary', () => {
    const f = flags(['a', 'a', 'b']);
    expect(f[0]!.isFirstInBatch).toBe(true);
    expect(f[1]).toEqual({ isFirstInBatch: false, isLastInBatch: true });
    expect(f[2]).toEqual({ isFirstInBatch: true, isLastInBatch: true });
  });

  it('a single-message batch is both first and last', () => {
    expect(flags(['x'])[0]).toEqual({ isFirstInBatch: true, isLastInBatch: true });
  });
});

describe('computeBatchFlagsImpl (property)', () => {
  it('flags match the consecutive-run definition for every message', () => {
    fc.assert(
      fc.property(
        fc.array(fc.option(fc.constantFrom('a', 'b', 'c'), { nil: undefined }), {
          maxLength: 20,
        }),
        (list) => {
          const messages = list.map((b) => msg(b ?? undefined));
          const map = computeBatchFlagsImpl(messages);
          for (let i = 0; i < list.length; i++) {
            const f = map.get(messages[i])!;
            if (!list[i]) {
              if (!(f.isFirstInBatch && f.isLastInBatch)) return false;
            } else {
              const prev = i > 0 ? list[i - 1] : undefined;
              const next = i < list.length - 1 ? list[i + 1] : undefined;
              if (f.isFirstInBatch !== (list[i] !== prev)) return false;
              if (f.isLastInBatch !== (list[i] !== next)) return false;
            }
          }
          return true;
        },
      ),
    );
  });
});
