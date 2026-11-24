/**
 * A staged batch hands each file off once the SDK holds it (pending), as Android does
 * ("the next file starts once this one is pending; the outbox keeps the order"), instead of
 * waiting up to 15 s per file behind an unsent message of the same chat.
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
import { QUEUED_ANSWER_WAIT_MS, sendWithState } from './send';

/** Pending only: the SDK holds the message behind an unsent one and says nothing more. */
const pendingOnly = (localMessageId: string) => (listener: any, message: any) => {
  listener.onMessagePending(offlineMessage(message, { localMessageId, status: 'PENDING' }));
};

describe('sendWithState hand-off at pending', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    vi.useFakeTimers();
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    vi.useRealTimers();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('without the option a connected send waits for its answer, up to the bound', async () => {
    fake.scriptSend(pendingOnly('L1'));
    let settled = false;
    sendWithState(textMessage('a'), 'text').then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(settled).toBe(true);
  });

  it('with the option the answer is the pending one, at once, even while connected', async () => {
    fake.scriptSend(pendingOnly('L2'));
    const result = await sendWithState(textMessage('b'), 'text', { handOffAtPending: true });
    expect(result.state).toBe('sending');
    expect(result.final).toBeInstanceOf(Promise);
  });

  it('the final answer still arrives on `final`: sent', async () => {
    fake.scriptSend((listener, message) => {
      pendingOnly('L3')(listener, message);
      setTimeout(
        () => listener.onMessageSent(offlineMessage(message, { id: 9, localMessageId: 'L3' })),
        50
      );
    });
    const result = await sendWithState(textMessage('c'), 'text', { handOffAtPending: true });
    await vi.advanceTimersByTimeAsync(60);
    await expect(result.final).resolves.toMatchObject({ state: 'sent' });
  });

  it('the final answer still arrives on `final`: a failure', async () => {
    fake.scriptSend((listener, message) => {
      pendingOnly('L4')(listener, message);
      setTimeout(() => {
        const failed = offlineMessage(message, { localMessageId: 'L4', status: 'FAILED' });
        listener.onError({ code: 'ERR_X' }, 'SERVER_ERROR');
        void failed;
      }, 50);
    });
    const result = await sendWithState(textMessage('d'), 'text', { handOffAtPending: true });
    // the SDK marks the pending message failed before it reports the error
    const pending = result.message as any;
    pending.setStatus('FAILED');
    await vi.advanceTimersByTimeAsync(60);
    await expect(result.final).resolves.toMatchObject({ state: 'failed' });
  });

  it('a send that fails with no pending is the failure itself, never handed off', async () => {
    fake.scriptSend(listener => listener.onError({ code: 'ERR_X' }));
    const result = await sendWithState(textMessage('e'), 'text', { handOffAtPending: true });
    expect(result.state).toBe('failed');
  });
});
