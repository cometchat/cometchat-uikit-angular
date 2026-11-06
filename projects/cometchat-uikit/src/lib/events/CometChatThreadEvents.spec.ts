/**
 * CometChatThreadEvents Tests
 *
 * Covers: publish → subject delivery, the typed subscribe helper, multiple
 * subscribers, unsubscribe, and DestroyRef-driven cleanup.
 *
 * @module events/thread
 */

import { describe, it, expect, vi } from 'vitest';
import { DestroyRef } from '@angular/core';
import { CometChatThreadEvents, IThreadSubscriptionChanged } from './CometChatThreadEvents';

/** A DestroyRef stand-in whose destroy hooks can be fired on demand. */
function makeDestroyRef() {
  const hooks: Array<() => void> = [];
  const ref = {
    onDestroy: (cb: () => void) => {
      hooks.push(cb);
      return () => {};
    },
  } as unknown as DestroyRef;
  return { ref, destroy: () => hooks.forEach(h => h()), hooks };
}

describe('CometChatThreadEvents', () => {
  it('delivers a published payload to a raw subject subscriber unchanged', () => {
    const seen: IThreadSubscriptionChanged[] = [];
    const sub = CometChatThreadEvents.ccThreadSubscriptionChanged.subscribe(e => seen.push(e));
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 42, subscribed: true });
    sub.unsubscribe();
    expect(seen).toEqual([{ parentMessageId: 42, subscribed: true }]);
  });

  it('passes the same object reference through', () => {
    const payload = { parentMessageId: 1, subscribed: false };
    let received: IThreadSubscriptionChanged | undefined;
    const sub = CometChatThreadEvents.onThreadSubscriptionChanged(e => (received = e));
    CometChatThreadEvents.publishThreadSubscriptionChanged(payload);
    sub.unsubscribe();
    expect(received).toBe(payload);
  });

  it('delivers events in publish order to the typed helper', () => {
    const seen: IThreadSubscriptionChanged[] = [];
    const sub = CometChatThreadEvents.onThreadSubscriptionChanged(e => seen.push(e));
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 1, subscribed: true });
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 1, subscribed: false });
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 2, subscribed: true });
    sub.unsubscribe();
    expect(seen.map(e => `${e.parentMessageId}:${e.subscribed}`)).toEqual(['1:true', '1:false', '2:true']);
  });

  it('fans out to every subscriber (header and action sheet stay in sync)', () => {
    const header = vi.fn();
    const sheet = vi.fn();
    const s1 = CometChatThreadEvents.onThreadSubscriptionChanged(header);
    const s2 = CometChatThreadEvents.onThreadSubscriptionChanged(sheet);
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 9, subscribed: true });
    s1.unsubscribe();
    s2.unsubscribe();
    expect(header).toHaveBeenCalledWith({ parentMessageId: 9, subscribed: true });
    expect(sheet).toHaveBeenCalledWith({ parentMessageId: 9, subscribed: true });
  });

  it('does not deliver events published after unsubscribe', () => {
    const cb = vi.fn();
    const sub = CometChatThreadEvents.onThreadSubscriptionChanged(cb);
    sub.unsubscribe();
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 3, subscribed: true });
    expect(cb).not.toHaveBeenCalled();
    expect(sub.closed).toBe(true);
  });

  it('does not replay events published before subscribing', () => {
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 4, subscribed: true });
    const cb = vi.fn();
    const sub = CometChatThreadEvents.onThreadSubscriptionChanged(cb);
    sub.unsubscribe();
    expect(cb).not.toHaveBeenCalled();
  });

  it('publishing with no subscribers does not throw', () => {
    expect(() =>
      CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 5, subscribed: false })
    ).not.toThrow();
  });

  describe('DestroyRef cleanup', () => {
    it('registers exactly one destroy hook and unsubscribes when it fires', () => {
      const { ref, destroy, hooks } = makeDestroyRef();
      const cb = vi.fn();
      const sub = CometChatThreadEvents.onThreadSubscriptionChanged(cb, ref);
      expect(hooks).toHaveLength(1);

      CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 6, subscribed: true });
      expect(cb).toHaveBeenCalledTimes(1);

      destroy();
      expect(sub.closed).toBe(true);
      CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 6, subscribed: false });
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('tolerates a destroy after a manual unsubscribe', () => {
      const { ref, destroy } = makeDestroyRef();
      const sub = CometChatThreadEvents.onThreadSubscriptionChanged(() => {}, ref);
      sub.unsubscribe();
      expect(() => destroy()).not.toThrow();
      expect(sub.closed).toBe(true);
    });

    it('destroying one owner leaves other subscribers attached', () => {
      const a = makeDestroyRef();
      const cbA = vi.fn();
      const cbB = vi.fn();
      CometChatThreadEvents.onThreadSubscriptionChanged(cbA, a.ref);
      const subB = CometChatThreadEvents.onThreadSubscriptionChanged(cbB);
      a.destroy();
      CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId: 7, subscribed: true });
      subB.unsubscribe();
      expect(cbA).not.toHaveBeenCalled();
      expect(cbB).toHaveBeenCalledWith({ parentMessageId: 7, subscribed: true });
    });
  });
});
