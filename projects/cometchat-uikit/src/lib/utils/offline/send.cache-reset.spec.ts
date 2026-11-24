/**
 * A cache reset is not a logout: an awaited send for a message the reset
 * lost is told so, its preview URL is released, and a logout rejects the
 * Promise once with DISCARDED (Android OfflineSend.rejectOpenCalls).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { isQuietRejection } from './identity';
import { OfflineHub } from './offline-hub';
import { revokeWhenSettled, sendWithState, sendWithStatePromise } from './send';

/** A send the SDK queued: pending, then the not-connected notice. */
const queued = (localMessageId: string) => (listener: any, message: any) => {
  listener.onMessagePending(offlineMessage(message, { localMessageId, status: 'PENDING' }));
  listener.onError({ code: 'FAILED_TO_FETCH' });
};

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('send Promise and previews across a cache reset', () => {
  let fake: OfflineSdkFake;
  const revoke = vi.fn();

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revoke,
      configurable: true,
      writable: true,
    });
    revoke.mockReset();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a reset that lost the outbox rejects the awaited send with DISCARDED', async () => {
    fake.scriptSend(queued('L1'));
    const message = textMessage('lost');
    const promise = sendWithStatePromise(message, 'text');
    promise.catch(() => undefined);
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', -1);
    await expect(promise).rejects.toMatchObject({ code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' });
  });

  it('a reset that lost nothing leaves the send waiting for the outbox', async () => {
    fake.scriptSend(queued('L2'));
    const message = textMessage('kept');
    const promise = sendWithStatePromise(message, 'text');
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_RESET', 0);
    const ack = offlineMessage(textMessage('kept'), { id: 71, localMessageId: 'L2' });
    fake.fire('offline', 'onOutboxMessageSent', ack);
    await expect(promise).resolves.toBe(ack);
  });

  it('a logout rejects the awaited send once with DISCARDED, and a late ack changes nothing', async () => {
    fake.scriptSend(queued('L3'));
    const outcomes: string[] = [];
    sendWithStatePromise(textMessage('out'), 'text').then(
      () => outcomes.push('resolved'),
      (e: any) => outcomes.push(`rejected:${e.code}`)
    );
    await flush();
    OfflineHub.getInstance().endSession();
    await flush();
    fake.fire(
      'offline',
      'onOutboxMessageSent',
      offlineMessage(textMessage('out'), { id: 72, localMessageId: 'L3' })
    );
    await flush();
    expect(outcomes).toEqual(['rejected:ERROR_OFFLINE_MESSAGE_DISCARDED']);
  });

  it('a logout before the SDK answered a send settles it as a quiet failure', async () => {
    fake.scriptSend(() => undefined); // the SDK never calls back
    const result = sendWithState(textMessage('lost'), 'text');
    await flush();
    OfflineHub.getInstance().endSession();
    await expect(result).resolves.toMatchObject({
      state: 'failed',
      reason: 'DISCARDED',
      error: { code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' },
      quiet: true,
    });
  });

  it('the preview URLs of a queued media send are released when a reset loses it, or on logout', () => {
    const queued = offlineMessage(textMessage('a'), { localMessageId: 'LA', status: 'PENDING' });
    revokeWhenSettled(queued, ['blob:a']);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'CORRUPTED', 1);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:a');

    const other = offlineMessage(textMessage('b'), { localMessageId: 'LB', status: 'PENDING' });
    revokeWhenSettled(other, ['blob:b']);
    OfflineHub.getInstance().endSession();
    expect(revoke).toHaveBeenCalledWith('blob:b');
  });

  it('a reset that lost nothing keeps the preview URL until the message is sent', () => {
    const queued = offlineMessage(textMessage('c'), { localMessageId: 'LC', status: 'PENDING' });
    revokeWhenSettled(queued, ['blob:c']);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_RESET', 0);
    expect(revoke).not.toHaveBeenCalled();
    fake.fire(
      'offline',
      'onOutboxMessageSent',
      offlineMessage(textMessage('c'), { id: 9, localMessageId: 'LC' })
    );
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  // A rejection has to be a usable Error: `Error.message` is the sentence a
  // `catch (e) { e.message }` prints and the row travels beside it as `sentMessage`.
  // Assigning the BaseMessage over `message` left integrators printing "[object Object]".
  it('an outbox removal rejects with text, the documented code and the row as sentMessage', async () => {
    fake.scriptSend(queued('L4'));
    const promise = sendWithStatePromise(textMessage('over'), 'text');
    promise.catch(() => undefined);
    await flush();
    const row = offlineMessage(textMessage('over'), { localMessageId: 'L4', status: 'FAILED' });
    // QUEUE_OVERFLOW is a removal, so it rejects with ERROR_OFFLINE_MESSAGE_DISCARDED
    // rather than with the raw reason as its code.
    fake.fire('offline', 'onOutboxMessageFailed', row, 'QUEUE_OVERFLOW');
    const error: any = await promise.then(
      () => undefined,
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.message).toBe('string');
    expect(error.code).toBe('ERROR_OFFLINE_MESSAGE_DISCARDED');
    expect(error.sentMessage).toBe(row);
  });

  it('a real outbox failure rejects with the reason as text and code, and the row as sentMessage', async () => {
    fake.scriptSend(queued('L5'));
    const promise = sendWithStatePromise(textMessage('nope'), 'text');
    promise.catch(() => undefined);
    await flush();
    const row = offlineMessage(textMessage('nope'), { localMessageId: 'L5', status: 'FAILED' });
    fake.fire('offline', 'onOutboxMessageFailed', row, 'ERROR_MESSAGE_SEND_FAILED');
    const error: any = await promise.then(
      () => undefined,
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('ERROR_MESSAGE_SEND_FAILED');
    expect(error.code).toBe('ERROR_MESSAGE_SEND_FAILED');
    expect(error.sentMessage).toBe(row);
  });

  it('isQuietRejection accepts the new code and the old DISCARDED, and nothing else', () => {
    expect(isQuietRejection({ code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' })).toBe(true);
    expect(isQuietRejection({ code: 'DISCARDED' })).toBe(true);
    expect(isQuietRejection({ code: 'ERROR_INTERNET_UNAVAILABLE' })).toBe(false);
    expect(isQuietRejection(null)).toBe(false);
  });
});
