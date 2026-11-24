import { describe, expect, it } from 'vitest';
import { offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { OfflineReplyCount } from './reply-count';
import type { SendStateEvent } from './offline-hub';

function reply(localMessageId: string, parentId: number, id = 0) {
  const m = offlineMessage(textMessage('r'), { localMessageId, id: id || undefined });
  m.setParentMessageId(parentId);
  return m;
}

const event = (state: SendStateEvent['state'], message: ReturnType<typeof reply>): SendStateEvent =>
  ({
    gen: 1,
    state,
    message,
    localMessageId: (message as any).getLocalMessageId(),
  }) as SendStateEvent;

describe('thread header reply count, offline path (UIT-SEND-21)', () => {
  it('counts an own reply once, from pending, and never again on its ack', () => {
    const count = new OfflineReplyCount();
    const pending = reply('L1', 10);
    expect(count.apply(event('sending', pending), 10)).toBe(1);
    // A retry re-announces sending: still one.
    expect(count.apply(event('sending', pending), 10)).toBe(0);
    const acked = reply('L1', 10, 55);
    expect(count.apply(event('sent', acked), 10)).toBe(0);
    expect(count.wasCounted(acked)).toBe(true);
  });

  it('a discarded reply uncounts; a failed one keeps its place', () => {
    const count = new OfflineReplyCount();
    count.apply(event('sending', reply('L1', 10)), 10);
    count.apply(event('sending', reply('L2', 10)), 10);
    expect(count.apply(event('failed', reply('L2', 10)), 10)).toBe(0);
    expect(count.apply(event('discarded', reply('L1', 10)), 10)).toBe(-1);
    expect(count.apply(event('discarded', reply('L1', 10)), 10)).toBe(0);
  });

  it('ignores replies to other threads and top-level sends', () => {
    const count = new OfflineReplyCount();
    expect(count.apply(event('sending', reply('L1', 11)), 10)).toBe(0);
    expect(
      count.apply(
        event('sending', offlineMessage(textMessage('top'), { localMessageId: 'L2' }) as any),
        10
      )
    ).toBe(0);
  });

  it('moving to another thread forgets the counted replies', () => {
    const count = new OfflineReplyCount();
    const pending = reply('L1', 10);
    count.apply(event('sending', pending), 10);
    count.reset();
    expect(count.wasCounted(pending)).toBe(false);
    // Counted again in the new thread, since nothing is remembered.
    expect(count.apply(event('sending', pending), 10)).toBe(1);
  });
});
