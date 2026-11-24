/**
 * `CometChatUIKit.send*` (sendWithStatePromise) settles when a cache reset or a
 * logout comes before the SDK's first answer is in, and when the queued send has
 * no local id: it rejects once with ERROR_OFFLINE_MESSAGE_DISCARDED (Android
 * OfflineSend.kt rejects open calls on SessionEnded and CacheReset).
 *
 * The reset used to be watched only after the first answer, which for a send
 * queued while connected comes up to QUEUED_ANSWER_WAIT_MS (15 s) later, and
 * cacheReset$ does not replay; a queued send with no local id never settled.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHub } from './offline-hub';
import { QUEUED_ANSWER_WAIT_MS, sendWithStatePromise } from './send';

const DISCARDED = 'rejected:ERROR_OFFLINE_MESSAGE_DISCARDED';

describe('send Promise: reset or logout before the first answer, and no local id', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.useRealTimers();
  });

  const flush = () => vi.advanceTimersByTimeAsync(1);

  function track(promise: Promise<unknown>): string[] {
    const outcomes: string[] = [];
    promise.then(
      () => outcomes.push('resolved'),
      (e: any) => outcomes.push(`rejected:${e?.code}`)
    );
    return outcomes;
  }

  /** Queued while connected, behind an unsent message of its chat: no answer for up to 15 s. */
  const queuedConnected = (localMessageId: string) => (listener: any, message: any) => {
    listener.onMessagePending(offlineMessage(message, { localMessageId, status: 'PENDING' }));
  };

  it('a reset that loses the outbox inside the 15 s wait rejects once with DISCARDED', async () => {
    fake.connected = true;
    fake.scriptSend(queuedConnected('W1'));
    const outcomes = track(sendWithStatePromise(textMessage('w1'), 'text'));
    await flush();
    expect(outcomes).toEqual([]);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', -1);
    await flush();
    expect(outcomes).toEqual([DISCARDED]);
    // The bounded wait running out later changes nothing.
    await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS);
    fake.fire('offline', 'onOutboxMessageSent', offlineMessage(textMessage('w1'), { id: 9, localMessageId: 'W1' }));
    await flush();
    expect(outcomes).toEqual([DISCARDED]);
  });

  it('a reset that lost nothing inside the wait leaves the send to the outbox', async () => {
    fake.connected = true;
    fake.scriptSend(queuedConnected('W2'));
    const outcomes = track(sendWithStatePromise(textMessage('w2'), 'text'));
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_RESET', 0);
    await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS);
    fake.fire('offline', 'onOutboxMessageSent', offlineMessage(textMessage('w2'), { id: 10, localMessageId: 'W2' }));
    await flush();
    expect(outcomes).toEqual(['resolved']);
  });

  /** Queued offline, but the pending message carries no local id. */
  const queuedNoLocalId = (listener: any, message: any) => {
    listener.onMessagePending(offlineMessage(message, { status: 'PENDING' }));
    listener.onError({ code: 'FAILED_TO_FETCH' });
  };

  it('a queued send with no local id rejects on logout instead of never settling', async () => {
    fake.connected = false;
    fake.scriptSend(queuedNoLocalId);
    const outcomes = track(sendWithStatePromise(textMessage('n1'), 'text'));
    await flush();
    expect(outcomes).toEqual([]);
    OfflineHub.getInstance().endSession();
    await flush();
    expect(outcomes).toEqual([DISCARDED]);
  });

  it('a queued send with no local id rejects on a reset that loses the outbox', async () => {
    fake.connected = false;
    fake.scriptSend(queuedNoLocalId);
    const outcomes = track(sendWithStatePromise(textMessage('n2'), 'text'));
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'CORRUPTED', 2);
    await flush();
    expect(outcomes).toEqual([DISCARDED]);
  });
});
