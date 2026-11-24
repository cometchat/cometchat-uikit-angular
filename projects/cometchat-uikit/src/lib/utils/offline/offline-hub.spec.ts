/** The hub: one place that sees the SDK's offline events, and the per-session marks the kit keeps. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  installOfflineSdk,
  offlineMessage,
  OfflineSdkFake,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { conversationIdOf, OfflineHub, OfflineNotice } from './offline-hub';

describe('OfflineHub', () => {
  beforeEach(() => OfflineHub.resetForTests());
  afterEach(() => OfflineHub.resetForTests());

  it('is one instance until reset', () => {
    const hub = OfflineHub.getInstance();
    expect(OfflineHub.getInstance()).toBe(hub);
    OfflineHub.resetForTests();
    expect(OfflineHub.getInstance()).not.toBe(hub);
  });

  it('keeps a notice raised before any screen listened, and hands it over once', () => {
    const hub = OfflineHub.getInstance();
    const notice: OfflineNotice = { gen: hub.gen, kind: 'unsent_messages_lost', count: 1 };
    hub.notice$.next(notice);
    expect(hub.claimNotices()).toEqual([notice]);
    expect(hub.claimNotices()).toEqual([]);
  });

  it('endSession bumps gen, tells both session streams, and forgets the direct failures', () => {
    const hub = OfflineHub.getInstance();
    const seen: string[] = [];
    hub.session$.subscribe(gen => seen.push(`session:${gen}`));
    hub.sessionEnd$.subscribe(gen => seen.push(`end:${gen}`));
    const message = offlineMessage(textMessage('a'), { muid: 'M' });
    hub.markDirectFailed(message, 'QUEUE_FULL');
    expect(hub.directFailureOf(message)).toBe('QUEUE_FULL');
    hub.endSession();
    expect(hub.gen).toBe(1);
    expect(seen).toEqual(['session:1', 'end:1']);
    expect(hub.directFailureOf(message)).toBeUndefined();
  });

  it('a notice of an earlier session is not handed to a later screen', () => {
    const hub = OfflineHub.getInstance();
    hub.notice$.next({ gen: hub.gen, kind: 'unsent_messages_lost', count: 1 });
    hub.endSession();
    expect(hub.claimNotices()).toEqual([]);
  });

  it('a direct failure is keyed by muid and can be cleared', () => {
    const hub = OfflineHub.getInstance();
    const message = offlineMessage(textMessage('a'), { muid: 'M' });
    const noMuid = offlineMessage(textMessage('b'), {});
    hub.markDirectFailed(message, 'BYTE_OVERFLOW');
    hub.markDirectFailed(noMuid, 'BYTE_OVERFLOW');
    expect(hub.directFailureOf(message)).toBe('BYTE_OVERFLOW');
    expect(hub.directFailureOf(noMuid)).toBeUndefined();
    expect(hub.failureReasonOf(message)).toBe('BYTE_OVERFLOW');
    hub.clearDirectFailed(message);
    expect(hub.directFailureOf(message)).toBeUndefined();
    expect(hub.failureReasonOf(message)).toBe('');
  });

  it('a stranded send is taken once', () => {
    const hub = OfflineHub.getInstance();
    const message = offlineMessage(textMessage('a'), { muid: 'M' });
    hub.markStranded(message);
    expect(hub.directFailureOf(message)).not.toBeUndefined();
    expect(hub.takeStranded(message)).toBe(true);
    expect(hub.takeStranded(message)).toBe(false);
  });

  it('stateOf is undefined for a send the hub has not seen', () => {
    expect(OfflineHub.getInstance().stateOf('nope')).toBeUndefined();
  });

  /**
   * ANG-8: the four per-session marks keep at most 500 entries (Android bounds
   * its direct-failure ids the same way, `OfflineSend.kt`, LRU). Writing a key
   * again makes it the newest; the oldest-written key goes first.
   */
  describe('bounded per-session marks (ANG-8)', () => {
    const CAP = 500;
    const byMuid = (i: number) => offlineMessage(textMessage(`m${i}`), { muid: `M${i}` });
    let fake: OfflineSdkFake | null = null;
    afterEach(() => {
      fake?.restore();
      fake = null;
    });

    it('directFailures keeps the newest 500 and evicts the oldest', () => {
      const hub = OfflineHub.getInstance();
      for (let i = 0; i <= CAP; i++) hub.markDirectFailed(byMuid(i), 'QUEUE_FULL');
      expect(hub.directFailureOf(byMuid(0))).toBeUndefined();
      expect(hub.directFailureOf(byMuid(1))).toBe('QUEUE_FULL');
      expect(hub.directFailureOf(byMuid(CAP))).toBe('QUEUE_FULL');
    });

    it('writing a direct failure again makes it the newest entry', () => {
      const hub = OfflineHub.getInstance();
      for (let i = 0; i < CAP; i++) hub.markDirectFailed(byMuid(i), 'QUEUE_FULL');
      hub.markDirectFailed(byMuid(0), 'BYTE_OVERFLOW');
      hub.markDirectFailed(byMuid(CAP), 'QUEUE_FULL');
      expect(hub.directFailureOf(byMuid(0))).toBe('BYTE_OVERFLOW');
      expect(hub.directFailureOf(byMuid(1))).toBeUndefined();
      expect(hub.directFailureOf(byMuid(CAP))).toBe('QUEUE_FULL');
    });

    it('failureReasons keeps the newest 500', () => {
      const hub = OfflineHub.getInstance();
      const byLocal = (i: number) => offlineMessage(textMessage(`m${i}`), { localMessageId: `L${i}` });
      for (let i = 0; i <= CAP; i++) hub.reportSendState(byLocal(i), 'failed', { reason: 'PERMANENT' });
      expect(hub.failureReasonOf(byLocal(0))).toBe('');
      expect(hub.failureReasonOf(byLocal(1))).toBe('PERMANENT');
      expect(hub.failureReasonOf(byLocal(CAP))).toBe('PERMANENT');
    });

    it('strandedUnnoticed keeps the newest 500', () => {
      const hub = OfflineHub.getInstance();
      for (let i = 0; i <= CAP; i++) hub.markStranded(byMuid(i));
      expect(hub.takeStranded(byMuid(0))).toBe(false);
      expect(hub.takeStranded(byMuid(1))).toBe(true);
      expect(hub.takeStranded(byMuid(CAP))).toBe(true);
    });

    it('readWhileOffline replays the newest 500 chats after the next sync', () => {
      fake = installOfflineSdk();
      const hub = OfflineHub.getInstance();
      hub.start();
      for (let i = 0; i <= CAP; i++) hub.rememberReadWhileOffline(`peer${i}`, 'user');
      fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
      const calls = fake.callsTo('markConversationAsRead');
      expect(calls).toHaveLength(CAP);
      expect(calls).not.toContainEqual(['peer0', 'user']);
      expect(calls).toContainEqual(['peer1', 'user']);
      expect(calls).toContainEqual([`peer${CAP}`, 'user']);
    });

    it('remembering a chat again makes it the newest entry', () => {
      fake = installOfflineSdk();
      const hub = OfflineHub.getInstance();
      hub.start();
      for (let i = 0; i < CAP; i++) hub.rememberReadWhileOffline(`peer${i}`, 'user');
      hub.rememberReadWhileOffline('peer0', 'user');
      hub.rememberReadWhileOffline(`peer${CAP}`, 'user');
      fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
      const calls = fake.callsTo('markConversationAsRead');
      expect(calls).toHaveLength(CAP);
      expect(calls).toContainEqual(['peer0', 'user']);
      expect(calls).not.toContainEqual(['peer1', 'user']);
    });

    it('endSession clears every mark, however many there were', () => {
      const hub = OfflineHub.getInstance();
      for (let i = 0; i < 2 * CAP; i++) hub.markStranded(byMuid(i));
      hub.endSession();
      expect(hub.directFailureOf(byMuid(2 * CAP - 1))).toBeUndefined();
      expect(hub.takeStranded(byMuid(2 * CAP - 1))).toBe(false);
    });
  });
});

describe('conversationIdOf', () => {
  it('is the id the SDK stamped on the message, or empty', () => {
    expect(conversationIdOf(null)).toBe('');
    expect(conversationIdOf({ getConversationId: () => 'user_peer' } as any)).toBe('user_peer');
    expect(conversationIdOf({ getConversationId: () => 5 } as any)).toBe('');
    expect(conversationIdOf({ getConversationId: () => { throw new Error('x'); } } as any)).toBe('');
  });
});
