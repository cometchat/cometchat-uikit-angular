/**
 * A server-refused queued send must say WHY it failed
 * (Aanshi's D7 on #674, same on React).
 *
 * On 4.3.1 the per-send `onError` is called with the raw server error, which
 * carries no `MessageFailureReason`, and the SDK has already stamped the
 * pending row FAILED with its own reason (PERMANENT). The global
 * `onOutboxMessageFailed` that carries that reason comes afterwards and the
 * hub drops it as not new, so the state event published here is the only one
 * app code sees - and it went out with `reason: ''`.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installOfflineSdk, offlineMessage, OfflineSdkFake, textMessage } from '../../testing/offline-sdk-fake';
import { OfflineHub, SendStateEvent } from './offline-hub';
import { sendWithState } from './send';

/** The SDK queues the send, then the server refuses it. */
const refusedByServer =
  (localMessageId: string, failureReason: string) => (listener: any, message: any) => {
    listener.onMessagePending?.(offlineMessage(message, { localMessageId, status: 'PENDING' }));
    // The row is FAILED with the SDK's own reason; the error is the server's.
    offlineMessage(message, { localMessageId, status: 'FAILED', failureReason });
    listener.onError?.({
      code: 'ERR_USER_BLOCKED',
      message: 'The receiver has blocked the sender',
    });
  };

describe('a queued send the server refuses', () => {
  let fake: OfflineSdkFake;
  let events: SendStateEvent[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    events = [];
    hub.sendState$.subscribe(event => events.push(event));
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('reports the reason the SDK stamped on the row', async () => {
    fake.scriptSend(refusedByServer('L1', 'PERMANENT'));

    const result = await sendWithState(textMessage('blocked'), 'text');

    expect(result.state).toBe('failed');
    expect(result.reason).toBe('PERMANENT');
    const failed = events.filter(e => e.state === 'failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBe('PERMANENT');
  });

  it('keeps a reason the error itself carries', async () => {
    // A refusal the kit can read off the error is unchanged.
    fake.scriptSend((listener: any, message: any) => {
      listener.onMessagePending?.(offlineMessage(message, { localMessageId: 'L2', status: 'PENDING' }));
      offlineMessage(message, { localMessageId: 'L2', status: 'FAILED', failureReason: 'PERMANENT' });
      listener.onError?.({ code: 'TRANSIENT' });
    });

    const result = await sendWithState(textMessage('flaky'), 'text');

    expect(result.reason).toBe('TRANSIENT');
  });

  it('is still empty when neither the error nor the row has one', async () => {
    fake.scriptSend((listener: any, message: any) => {
      listener.onMessagePending?.(offlineMessage(message, { localMessageId: 'L3', status: 'PENDING' }));
      offlineMessage(message, { localMessageId: 'L3', status: 'FAILED' });
      listener.onError?.({ code: 'ERR_SOMETHING' });
    });

    const result = await sendWithState(textMessage('unknown'), 'text');

    expect(result.state).toBe('failed');
    expect(result.reason).toBe('');
  });
});
