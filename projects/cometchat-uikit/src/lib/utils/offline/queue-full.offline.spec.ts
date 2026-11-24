/**
 * UIK-SEND-03 / UIT-SEND-08, UIT-SEND-23: a send the outbox refuses because the
 * queue is full (or a file is over the byte budget) is failed (direct) with a
 * notice, shown once.
 *
 * Regression: the 4.3.0 SDK reports a queue-full refusal to the send's own
 * `onError` with Android's code `ERROR_PENDING_QUEUE_LIMIT` (not the
 * `QUEUE_FULL` reason), then to the global `onOutboxMessageFailed(message,
 * 'QUEUE_FULL')`. The kit read no reason from the first and dropped the second as
 * an already reported failure, so the notice never showed. The unit fake used to
 * answer `{ code: 'QUEUE_FULL' }`, which the real SDK never sends.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  installOfflineSdk,
  offlineMessage,
  OfflineSdkFake,
  sendScripts,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHubService } from '../../services/offline-hub.service';
import { OfflineHub, OfflineNotice } from './offline-hub';
import { failureReasonFromError, sendWithState } from './send';
import { unsentActionsOf } from './unsent-actions';
import { offlineNoticeText } from './notices';

function refused(text: string, muid: string) {
  const m = textMessage(text);
  m.setMuid(muid);
  return m;
}

describe('queue full (UIK-SEND-03)', () => {
  let fake: OfflineSdkFake;
  let notices: OfflineNotice[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    fake.connected = false;
    notices = [];
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.notice$.subscribe(n => notices.push(n));
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it("reads QUEUE_FULL from the SDK's ERROR_PENDING_QUEUE_LIMIT code, and BYTE_OVERFLOW from its code", () => {
    expect(failureReasonFromError({ code: 'ERROR_PENDING_QUEUE_LIMIT' })).toBe('QUEUE_FULL');
    expect(failureReasonFromError({ code: 'BYTE_OVERFLOW' })).toBe('BYTE_OVERFLOW');
    expect(failureReasonFromError({ code: 'ERR_SOMETHING_ELSE' })).toBe('');
    expect(failureReasonFromError(undefined)).toBe('');
  });

  it('the per-send error first, then the global failure: failed (direct), one queue_full notice', async () => {
    fake.scriptSend(sendScripts.queueFull('LQ'));
    const m = refused('over the cap', 'MQ');
    const result = await sendWithState(m, 'text');
    expect(result).toMatchObject({ state: 'failed', direct: true, reason: 'QUEUE_FULL' });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(notices.map(n => n.kind)).toEqual(['queue_full']);
    expect(notices[0].message).toBe(m);
    const hub = OfflineHub.getInstance();
    expect(hub.directFailureOf(m)).toBe('QUEUE_FULL');
    expect(hub.stateOf('LQ')).toBe('failed');
    // Retry (a fresh send) and Delete.
    expect(unsentActionsOf(m)).toEqual({ retry: true, delete: true });
  });

  it('iOS order (a pending callback before the refusal) raises it once too', async () => {
    // Connected, a send answers once its own callback comes (offline the composer
    // settles on the pending callback and the outbox listener reports the rest).
    fake.connected = true;
    fake.scriptSend(sendScripts.queueFull('LI', { pendingFirst: true }));
    const m = refused('ios', 'MI');
    expect(await sendWithState(m, 'text')).toMatchObject({
      state: 'failed',
      direct: true,
      reason: 'QUEUE_FULL',
    });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(notices.map(n => n.kind)).toEqual(['queue_full']);
  });

  it('the global failure alone (no reason on the per-send error) still raises it, once', async () => {
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LG', status: 'FAILED' });
      listener.onError?.({ code: 'ERR_UNKNOWN' });
    });
    const m = refused('refused', 'MG');
    await sendWithState(m, 'text');
    expect(notices).toEqual([]);
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(notices.map(n => n.kind)).toEqual(['queue_full']);
    // The reason the outbox named is kept for the row.
    expect(OfflineHub.getInstance().directFailureOf(m)).toBe('QUEUE_FULL');
    expect(OfflineHub.getInstance().failureReasonOf(m)).toBe('QUEUE_FULL');
  });

  it('a byte-overflow refusal raises the file-too-large notice once', async () => {
    fake.scriptSend(sendScripts.byteOverflow('LB'));
    const m = refused('big file', 'MB');
    expect(await sendWithState(m, 'media')).toMatchObject({
      state: 'failed',
      direct: true,
      reason: 'BYTE_OVERFLOW',
    });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'BYTE_OVERFLOW');
    expect(notices.map(n => n.kind)).toEqual(['file_too_large_offline']);
  });

  it('a second refused message gets its own notice; a logout forgets the first', async () => {
    const hub = OfflineHub.getInstance();
    const a = refused('a', 'MA');
    fake.scriptSend(sendScripts.queueFull('LA'));
    await sendWithState(a, 'text');
    const b = refused('b', 'MB2');
    fake.scriptSend(sendScripts.queueFull('LB2'));
    await sendWithState(b, 'text');
    expect(notices.map(n => n.kind)).toEqual(['queue_full', 'queue_full']);
    hub.endSession();
    hub.raiseRefusalNotice(a, 'QUEUE_FULL');
    expect(notices).toHaveLength(3);
    hub.raiseRefusalNotice(a, 'TRANSIENT');
    expect(notices).toHaveLength(3);
  });

  it('the message list reads the notice from the hub service, with its text', async () => {
    const service = TestBed.inject(OfflineHubService);
    fake.scriptSend(sendScripts.queueFull('LV'));
    const m = refused('over the cap', 'MV');
    await sendWithState(m, 'text');
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    const shown = service.notices();
    expect(shown.map(n => n.kind)).toEqual(['queue_full']);
    expect(offlineNoticeText(shown[0])).not.toBe('');
  });
});
