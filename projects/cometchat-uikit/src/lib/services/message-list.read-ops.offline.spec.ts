/** AC-7.4 / UIT-LIFE-12: a chat read offline is marked read on the server after the next sync. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { markConversationAsReadImpl } from './message-list.read-ops';

describe('read while offline (AC-7.4)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('a not-connected markConversationAsRead is remembered and sent once after the sweep', async () => {
    let calls = 0;
    (CometChat as any).markConversationAsRead = vi.fn(() => {
      calls++;
      return calls === 1 ? Promise.reject({ code: 'FAILED_TO_FETCH' }) : Promise.resolve();
    });
    await markConversationAsReadImpl('sam', 'user');
    expect(calls).toBe(1);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect((CometChat as any).markConversationAsRead).toHaveBeenLastCalledWith('sam', 'user');
    expect(calls).toBe(2);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(calls).toBe(2);
  });

  it('offline off: a failure is only logged, nothing is replayed', async () => {
    fake.setEnabled(false);
    const mark = vi.fn(() => Promise.reject({ code: 'FAILED_TO_FETCH' }));
    (CometChat as any).markConversationAsRead = mark;
    await markConversationAsReadImpl('sam', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(mark).toHaveBeenCalledTimes(1);
  });
});
