/** Which actions an own unsent message offers on the offline path. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installOfflineSdk, OfflineSdkFake, offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { OfflineHub } from './offline-hub';
import { drawsUnsentState, isFailedUnsent, unsentActionsOf } from './unsent-actions';

describe('unsent actions', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('PENDING, SENDING and FAILED rows offer Retry and Delete', () => {
    for (const status of ['PENDING', 'SENDING', 'FAILED']) {
      expect(unsentActionsOf(offlineMessage(textMessage('a'), { status, localMessageId: 'L' }))).toEqual({
        retry: true,
        delete: true,
      });
    }
  });

  it('a sent row keeps its full menu (null)', () => {
    expect(unsentActionsOf(offlineMessage(textMessage('a'), { id: 5, status: 'SENT' }))).toBeNull();
    expect(unsentActionsOf(null)).toBeNull();
  });

  it('a row with no status, no server id and no hub history offers nothing', () => {
    expect(unsentActionsOf(offlineMessage(textMessage('a'), {}))).toEqual({ retry: false, delete: false });
  });

  it('a failed (direct) message offers both and counts as failed', () => {
    const direct = offlineMessage(textMessage('a'), { muid: 'M' });
    OfflineHub.getInstance().markDirectFailed(direct, 'QUEUE_FULL');
    expect(unsentActionsOf(direct)).toEqual({ retry: true, delete: true });
    expect(isFailedUnsent(direct)).toBe(true);
  });

  it('isFailedUnsent follows the outbox status', () => {
    expect(isFailedUnsent(offlineMessage(textMessage('a'), { status: 'FAILED' }))).toBe(true);
    expect(isFailedUnsent(offlineMessage(textMessage('a'), { status: 'PENDING' }))).toBe(false);
    expect(isFailedUnsent(null)).toBe(false);
  });

  it('drawsUnsentState: with offline on, or when the kill switch left a direct failure', () => {
    const plain = offlineMessage(textMessage('a'), { muid: 'M' });
    expect(drawsUnsentState(plain)).toBe(true);
    fake.setEnabled(false);
    expect(drawsUnsentState(plain)).toBe(false);
    OfflineHub.getInstance().markDirectFailed(plain, 'QUEUE_FULL');
    expect(drawsUnsentState(plain)).toBe(true);
  });
});
