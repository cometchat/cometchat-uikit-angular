vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  sendScripts,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { hasSdkFunction, isOfflineOn } from './offline-gate';
import { drawsUnsentState } from './unsent-actions';
import {
  isOutboxFailed,
  isSending,
  isSyncDelivered,
  isUnsent,
  localIdOf,
  rowKey,
  serverIdOf,
  statusOf,
  renderKey,
} from './identity';
import {
  compareRows,
  HeldReceipts,
  reconcileServerPage,
  removeRow,
  upsertSorted,
  cachedKeysOf,
  newestServerId,
} from './reconcile';
import { OfflineHub } from './offline-hub';
import {
  discardUnsentMessage,
  QUEUED_ANSWER_WAIT_MS,
  retryFailedMessage,
  sendKindOf,
  sendWithState,
  sendWithStatePromise,
} from './send';

function msg(text: string, state: Parameters<typeof offlineMessage>[1] = {}) {
  return offlineMessage(textMessage(text), state);
}

describe('OfflineGate', () => {
  let fake: OfflineSdkFake | null = null;
  afterEach(() => {
    fake?.restore();
    fake = null;
  });

  it('is off on an SDK without isOfflineEnabled (4.2.x)', () => {
    fake = installOfflineSdk({ bare: true });
    expect(typeof (CometChat as any).isOfflineEnabled).toBe('undefined');
    expect(isOfflineOn()).toBe(false);
    expect(hasSdkFunction('retryMessage')).toBe(false);
  });

  it('reads the SDK on every call, never a cached value', () => {
    fake = installOfflineSdk({ enabled: true });
    expect(isOfflineOn()).toBe(true);
    fake.setEnabled(false);
    expect(isOfflineOn()).toBe(false);
    fake.setEnabled(true);
    expect(isOfflineOn()).toBe(true);
  });

  it('answers false when the SDK throws', () => {
    fake = installOfflineSdk();
    (CometChat as any).isOfflineEnabled = () => {
      throw new Error('store not open');
    };
    expect(isOfflineOn()).toBe(false);
  });
});

describe('identity', () => {
  it('falls back to data.localMessageId on a server-parsed copy (A4)', () => {
    const m: any = textMessage('hi');
    m.getData = () => ({ localMessageId: 'loc-1' });
    expect(localIdOf(m)).toBe('loc-1');
  });

  it('never reads getStatus for a call (the call status lives there)', () => {
    const call: any = { getCategory: () => 'call', getStatus: () => 'FAILED' };
    expect(statusOf(call)).toBe('');
    expect(isOutboxFailed(call)).toBe(false);
  });

  it('keys rows by server id, then local id, then muid', () => {
    expect(rowKey(msg('a', { id: 12 }))).toBe('s:12');
    expect(rowKey(msg('b', { localMessageId: 'L' }))).toBe('l:L');
    expect(rowKey(msg('c', { muid: 'M' }))).toBe('m:M');
  });

  it('classifies send states', () => {
    expect(isSending(msg('a', { status: 'PENDING' }))).toBe(true);
    expect(isSending(msg('a', { status: 'SENDING' }))).toBe(true);
    expect(isOutboxFailed(msg('a', { status: 'FAILED' }))).toBe(true);
    expect(isUnsent(msg('a', { id: 5, status: 'SENT' }))).toBe(false);
    expect(isUnsent(msg('a', { localMessageId: 'L' }))).toBe(true);
    expect(isSyncDelivered(msg('a', { source: 'SYNC' }))).toBe(true);
    expect(serverIdOf(msg('a'))).toBe(0);
  });
});

describe('reconcile', () => {
  it('orders sent rows by (sentAt, id) and unsent rows last', () => {
    const rows = [
      msg('u', { localMessageId: 'L', sentAt: 1 }),
      msg('b', { id: 2, sentAt: 20 }),
      msg('a', { id: 1, sentAt: 10 }),
    ];
    const sorted = rows
      .slice()
      .sort(compareRows)
      .map(m => (m as CometChat.TextMessage).getText());
    expect(sorted).toEqual(['a', 'b', 'u']);
  });

  it('inserts a swept older message into its sorted place, not at the end', () => {
    const rows = [msg('old', { id: 1, sentAt: 10 }), msg('new', { id: 3, sentAt: 30 })];
    const { rows: next } = upsertSorted(rows, [msg('middle', { id: 2, sentAt: 20 })]);
    expect(next.map(m => serverIdOf(m))).toEqual([1, 2, 3]);
  });

  it('replaces by identity and never reverts a newer edit', () => {
    const edited = msg('edited', { id: 1, sentAt: 10, updatedAt: 50 });
    const stale = msg('stale', { id: 1, sentAt: 10, updatedAt: 40 });
    const { rows, changed } = upsertSorted([edited], [stale]);
    expect(changed).toBe(false);
    expect((rows[0] as CometChat.TextMessage).getText()).toBe('edited');
  });

  it('the ack replaces the pending row found by local id (one row, not two)', () => {
    const pending = msg('hi', { localMessageId: 'L1', muid: 'M1', sentAt: 5, status: 'PENDING' });
    const acked = msg('hi', { id: 9, localMessageId: 'L1', muid: 'M1', sentAt: 6, status: 'SENT' });
    const { rows } = upsertSorted([msg('x', { id: 1, sentAt: 1 }), pending], [acked]);
    expect(rows).toHaveLength(2);
    expect(serverIdOf(rows[1])).toBe(9);
  });

  it('removes a cached row the server page omits, only inside the page range', () => {
    const cached = [1, 2, 3, 4].map(id => msg(`m${id}`, { id, sentAt: id * 10 }));
    const unsent = msg('u', { localMessageId: 'L', sentAt: 99 });
    const keys = cachedKeysOf(cached.slice(1));
    const server = [msg('m2', { id: 2, sentAt: 20 }), msg('m4', { id: 4, sentAt: 40 })];
    const { rows } = reconcileServerPage([...cached, unsent], keys, server);
    expect(rows.map(r => serverIdOf(r) || 'unsent')).toEqual([1, 2, 4, 'unsent']);
  });

  it('an empty server page removes nothing', () => {
    const cached = [msg('a', { id: 1, sentAt: 1 })];
    expect(reconcileServerPage(cached, cachedKeysOf(cached), []).rows).toHaveLength(1);
  });

  it('cursors skip rows without a server id', () => {
    expect(
      newestServerId([msg('a', { id: 4, sentAt: 1 }), msg('u', { localMessageId: 'L' })])
    ).toBe(4);
  });

  it('removeRow finds a row by local id', () => {
    const rows = [msg('u', { localMessageId: 'L' })];
    expect(removeRow(rows, msg('u2', { localMessageId: 'L' })).rows).toHaveLength(0);
  });

  it('holds at most 200 early receipts', () => {
    const held = new HeldReceipts();
    for (let i = 1; i <= 250; i++) held.hold(i, {} as CometChat.MessageReceipt);
    expect(held.size).toBe(200);
    expect(held.take(1)).toBeUndefined();
    expect(held.take(250)).toBeDefined();
    expect(held.take(250)).toBeUndefined();
  });
});

describe('OfflineHub', () => {
  let fake: OfflineSdkFake | null = null;
  let sent: { status: MessageStatus; text: string }[];
  let stateChanges: string[];
  const subs: { unsubscribe(): void }[] = [];

  beforeEach(() => {
    OfflineHub.resetForTests();
    sent = [];
    stateChanges = [];
    subs.push(
      CometChatMessageEvents.ccMessageSent.subscribe(e =>
        sent.push({ status: e.status, text: (e.message as any).getText?.() })
      )
    );
    subs.push(
      CometChatMessageEvents.ccMessageSendStateChanged.subscribe(e => stateChanges.push(e.state))
    );
  });
  afterEach(() => {
    fake?.restore();
    fake = null;
    subs.splice(0).forEach(s => s.unsubscribe());
    OfflineHub.resetForTests();
  });

  it('registers nothing on an SDK without offline support', () => {
    fake = installOfflineSdk({ bare: true });
    const add = vi.spyOn(CometChat, 'addMessageListener');
    OfflineHub.getInstance().start();
    expect(add).not.toHaveBeenCalled();
    add.mockRestore();
  });

  it('registers each listener once, under distinct ids, even when started twice', () => {
    fake = installOfflineSdk({ enabled: false });
    OfflineHub.getInstance().start();
    OfflineHub.getInstance().start();
    const ids = [
      'addOfflineMessageListener',
      'addSyncListener',
      'addOfflineCacheResetListener',
      'addMediaDownloadListener',
      'addMessageListener',
      'addLoginListener',
    ].map(name => fake!.callsTo(name));
    ids.forEach(calls => expect(calls).toHaveLength(1));
    expect(new Set(ids.map(calls => calls[0][0])).size).toBe(ids.length);
  });

  it('is never unregistered on logout; logout bumps gen and forgets sends', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.reportSendState(msg('a', { localMessageId: 'L' }), 'sending', { announced: true });
    const gen = hub.gen;
    fake.fire('login', 'logoutSuccess');
    expect(hub.gen).toBe(gen + 1);
    expect(hub.stateOf('L')).toBeUndefined();
    expect(fake.callsTo('removeOfflineMessageListener')).toHaveLength(0);
  });

  it('a user switch ends the previous session', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.onLogin({ getUid: () => 'alice' } as any);
    const gen = hub.gen;
    hub.onLogin({ getUid: () => 'alice' } as any);
    expect(hub.gen).toBe(gen);
    hub.onLogin({ getUid: () => 'bob' } as any);
    expect(hub.gen).toBe(gen + 1);
  });

  it('emits exactly one public success when both the per-send and the outbox listener report it', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    const ack = msg('hello', { id: 7, localMessageId: 'L' });
    hub.reportSendState(msg('hello', { localMessageId: 'L' }), 'sending', { announced: true });
    hub.reportSendState(ack, 'sent');
    fake.fire('offline', 'onOutboxMessageSent', ack);
    expect(sent.filter(e => e.status === MessageStatus.success)).toHaveLength(1);
    expect(sent.filter(e => e.status === MessageStatus.inprogress)).toHaveLength(0);
    expect(stateChanges).toEqual(['sending', 'sent']);
  });

  it('a failed message being retried announces inprogress again (failed → sending)', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    const m = msg('x', { localMessageId: 'L', status: 'FAILED' });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'TRANSIENT');
    fake.fire(
      'offline',
      'onOutboxMessagePending',
      msg('x', { localMessageId: 'L', status: 'PENDING' })
    );
    expect(sent.map(e => e.status)).toEqual([MessageStatus.error, MessageStatus.inprogress]);
  });

  it('DISCARDED removes the row with one notice and never offers retry', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    const states: string[] = [];
    subs.push(
      hub.notice$.subscribe(n => notices.push(n.kind)),
      hub.sendState$.subscribe(e => states.push(e.state))
    );
    const m = msg('bye', { localMessageId: 'L' });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'DISCARDED');
    fake.fire('offline', 'onOutboxMessageFailed', m, 'DISCARDED');
    expect(states).toEqual(['discarded']);
    expect(notices).toEqual(['unsent_message_removed']);
  });

  it('QUEUE_FULL from the outbox is a direct failure with the queue-full notice', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    subs.push(hub.notice$.subscribe(n => notices.push(n.kind)));
    const m = msg('x', { localMessageId: 'L', muid: 'M' });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(hub.directFailureOf(m)).toBe('QUEUE_FULL');
    expect(notices).toEqual(['queue_full']);
  });

  it('cache reset: a count → "N lost"; unknown → "may be lost"; ENCRYPTION_CHANGED → none', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    const resets: unknown[] = [];
    subs.push(
      hub.notice$.subscribe(n => notices.push(n.kind)),
      CometChatMessageEvents.ccOfflineCacheReset.subscribe(e => resets.push(e))
    );
    fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', 3);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'WRONG_KEY', -1);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'ENCRYPTION_CHANGED', null);
    // Its unsent messages already fired DISCARDED (README §3.7): no extra notice, whatever the count.
    fake.fire('cacheReset', 'onOfflineCacheReset', 'ENCRYPTION_CHANGED', 2);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', 0);
    expect(notices).toEqual(['unsent_messages_lost', 'unsent_messages_maybe_lost']);
    expect(resets).toHaveLength(5);
  });

  it('a reset the SDK delivers before the app bootstraps still shows its notice, once', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'WRONG_KEY', -1);
    expect(hub.claimNotices().map(n => n.kind)).toEqual(['unsent_messages_maybe_lost']);
    expect(hub.claimNotices()).toEqual([]);
  });

  it('marks chats read offline as read after the next sync (AC-7.4)', () => {
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline('peer', 'user');
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markConversationAsRead')).toEqual([['peer', 'user']]);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markConversationAsRead')).toHaveLength(1);
  });
});

describe('sendWithState', () => {
  let fake: OfflineSdkFake;
  let events: MessageStatus[];
  let sub: { unsubscribe(): void };
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
    events = [];
    sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e.status));
  });
  afterEach(() => {
    sub.unsubscribe();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('uses the three-phase listener form', async () => {
    fake.scriptSend((l, m) => {
      l.onMessagePending(offlineMessage(m, { localMessageId: 'L' }));
      l.onMessageSent(msg('x', { id: 1, localMessageId: 'L' }));
    });
    const result = await sendWithState(textMessage('x'), 'text');
    expect(result.state).toBe('sent');
    expect(fake.callsTo('sendMessage')[0][1]).toBeDefined();
  });

  it('a not-connected error after pending is queued, not failed: no public error (BEH-SEND-10)', async () => {
    fake.scriptSend((l, m) => {
      l.onMessagePending(offlineMessage(m, { localMessageId: 'L', status: 'PENDING' }));
      l.onError({ code: 'FAILED_TO_FETCH' });
    });
    const result = await sendWithState(textMessage('x'), 'text');
    expect(result.state).toBe('sending');
    expect(events).not.toContain(MessageStatus.error);
    // The ack arrives later through the outbox.
    fake.fire('offline', 'onOutboxMessageSent', msg('x', { id: 3, localMessageId: 'L' }));
    expect(events).toEqual([MessageStatus.success]);
  });

  it('offline, a send queued behind another unsent one resolves on pending: the composer never waits on it (R77)', async () => {
    fake.connected = false;
    // Pending only: the SDK stays silent until the chat drains.
    fake.scriptSend((l, m) =>
      l.onMessagePending(offlineMessage(m, { localMessageId: 'L2', status: 'PENDING' }))
    );
    const result = await sendWithState(textMessage('second'), 'text');
    expect(result.state).toBe('sending');
    expect(events).not.toContain(MessageStatus.error);
    // The later ack still reaches the row through the outbox.
    fake.fire('offline', 'onOutboxMessageSent', msg('second', { id: 9, localMessageId: 'L2' }));
    expect(events).toEqual([MessageStatus.success]);
  });

  it('online, a pending send that goes unanswered resolves as sending after the bound', async () => {
    vi.useFakeTimers();
    try {
      fake.scriptSend((l, m) =>
        l.onMessagePending(offlineMessage(m, { localMessageId: 'L3', status: 'PENDING' }))
      );
      let state = '';
      void sendWithState(textMessage('x'), 'text').then(r => {
        state = r.state;
      });
      await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS - 1);
      expect(state).toBe('');
      await vi.advanceTimersByTimeAsync(1);
      expect(state).toBe('sending');
    } finally {
      vi.useRealTimers();
    }
  });

  it('an error with no pending is a direct failure (BEH-SEND-33)', async () => {
    fake.scriptSend(l => l.onError({ code: 'ERR_BLOCKED_BY_EXTENSION' }));
    const m = offlineMessage(textMessage('x'), { muid: 'M' });
    const result = await sendWithState(m, 'text');
    expect(result).toMatchObject({ state: 'failed', direct: true });
    expect(OfflineHub.getInstance().directFailureOf(m)).toBe('');
    expect(events).toEqual([MessageStatus.error]);
  });

  it('QUEUE_FULL after a pending callback (iOS order) is still a direct failure with a notice', async () => {
    const notices: string[] = [];
    const s = OfflineHub.getInstance().notice$.subscribe(n => notices.push(n.kind));
    fake.scriptSend((l, m) => {
      offlineMessage(m, { muid: 'M' });
      sendScripts.queueFull('L', { pendingFirst: true })(l, m);
    });
    const result = await sendWithState(textMessage('x'), 'text');
    s.unsubscribe();
    expect(result).toMatchObject({ state: 'failed', direct: true, reason: 'QUEUE_FULL' });
    expect(notices).toEqual(['queue_full']);
  });

  it('the statics Promise does not reject for a queued send and resolves on the later ack', async () => {
    fake.scriptSend((l, m) => {
      l.onMessagePending(offlineMessage(m, { localMessageId: 'L', status: 'PENDING' }));
      l.onError({ code: 'FAILED_TO_FETCH' });
    });
    let settled: unknown = 'pending';
    const promise = sendWithStatePromise(textMessage('x'), 'text').then(
      m => {
        settled = m;
      },
      e => {
        settled = e;
      }
    );
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe('pending');
    const ack = msg('x', { id: 4, localMessageId: 'L' });
    fake.fire('offline', 'onOutboxMessageSent', ack);
    await promise;
    expect(settled).toBe(ack);
  });

  it('the statics Promise rejects on a final failure', async () => {
    fake.scriptSend((l, m) => {
      l.onMessagePending(offlineMessage(m, { localMessageId: 'L', status: 'PENDING' }));
      l.onError({ code: 'FAILED_TO_FETCH' });
    });
    const promise = sendWithStatePromise(textMessage('x'), 'text');
    await Promise.resolve();
    await Promise.resolve();
    fake.fire(
      'offline',
      'onOutboxMessageFailed',
      msg('x', { localMessageId: 'L', status: 'FAILED' }),
      'PERMANENT'
    );
    await expect(promise).rejects.toMatchObject({ code: 'PERMANENT' });
  });

  it('Retry on an outbox row asks the SDK (retryMessage with the local id); the kit never re-sends itself', async () => {
    await retryFailedMessage(msg('x', { localMessageId: 'L', status: 'FAILED' }), 'text');
    expect(fake.callsTo('retryMessage').map(c => c[0])).toEqual(['L']);
    expect(fake.callsTo('sendMessage')).toHaveLength(0);
  });

  it('Retry puts the row back to sending at once, with no SDK callback to say so', async () => {
    // The SDK answers a retry only through onMessageSent / onError — there is no pending
    // callback — so the kit reports it itself, as Android (OfflineSend.kt:227) does.
    // Without that the row keeps reading "Not sent. Tap to retry" while it is queued.
    await retryFailedMessage(msg('x', { localMessageId: 'L', status: 'FAILED' }), 'text');
    expect(OfflineHub.getInstance().stateOf('L')).toBe('sending');
  });

  it('Retry on a direct failure is a fresh send', async () => {
    fake.scriptSend(l => l.onError({ code: 'X' }));
    const m = offlineMessage(textMessage('x'), { muid: 'M' });
    await sendWithState(m, 'text');
    fake.scriptSend((l, mm) => {
      l.onMessagePending(offlineMessage(mm, { localMessageId: 'L2' }));
      l.onMessageSent(msg('x', { id: 8, localMessageId: 'L2' }));
    });
    await retryFailedMessage(m, 'text');
    expect(fake.callsTo('sendMessage')).toHaveLength(2);
    expect(fake.callsTo('retryMessage')).toHaveLength(0);
    expect(OfflineHub.getInstance().directFailureOf(m)).toBeUndefined();
  });

  it('Retry on a failed interactive message sends it again through sendInteractiveMessage', async () => {
    const interactive = offlineMessage(textMessage('form'), { muid: 'MI' });
    (interactive as any).getCategory = () => 'interactive';
    fake.scriptSend(l => l.onError({ code: 'X' }));
    await sendWithState(interactive, 'interactive');
    expect(OfflineHub.getInstance().directFailureOf(interactive)).toBe('');
    fake.scriptSend((l, mm) => {
      l.onMessagePending(offlineMessage(mm, { localMessageId: 'LI2' }));
      l.onMessageSent(msg('form', { id: 8, localMessageId: 'LI2' }));
    });
    await retryFailedMessage(interactive, sendKindOf(interactive));
    expect(fake.callsTo('sendInteractiveMessage')).toHaveLength(2);
    expect(fake.callsTo('sendMessage')).toHaveLength(0);
    expect(fake.callsTo('retryMessage')).toHaveLength(0);
    expect(OfflineHub.getInstance().directFailureOf(interactive)).toBeUndefined();
  });

  it('Delete discards through the SDK and removes the row itself (no outbox event follows)', async () => {
    const states: string[] = [];
    const s = OfflineHub.getInstance().sendState$.subscribe(e => states.push(e.state));
    const removed = await discardUnsentMessage(
      msg('x', { localMessageId: 'L', status: 'PENDING' })
    );
    s.unsubscribe();
    expect(removed).toBe('removed');
    expect(fake.callsTo('discardLocalMessage').map(c => c[0])).toEqual(['L']);
    expect(states).toEqual(['discarded']);
  });

  it('a refused discard keeps the row', async () => {
    fake.discardResult = 'reject';
    expect(await discardUnsentMessage(msg('x', { localMessageId: 'L', status: 'SENDING' }))).toBe(
      'in-flight'
    );
  });
});

describe('renderKey (README §3.2, UIK-SEND-08)', () => {
  const sender = (uid: string) => ({ getSender: () => ({ getUid: () => uid }) });
  const row = (fields: { id?: number; local?: string; muid?: string; uid?: string }) =>
    ({
      ...sender(fields.uid ?? 'me'),
      getId: () => fields.id ?? 0,
      getLocalMessageId: () => fields.local,
      getMuid: () => fields.muid ?? '',
    }) as any;

  it('an own message keeps one key from pending to ack', () => {
    const pending = row({ local: 'L1', muid: 'M1' });
    const acked = row({ id: 9, local: 'L1', muid: 'M1' });
    expect(renderKey(pending, 'me')).toBe('l:L1');
    expect(renderKey(acked, 'me')).toBe(renderKey(pending, 'me'));
  });

  it('a server-parsed own copy matches through data.localMessageId', () => {
    const copy = {
      ...row({ id: 9, muid: 'M1' }),
      getLocalMessageId: () => undefined,
      getData: () => ({ localMessageId: 'L1' }),
    } as any;
    expect(renderKey(copy, 'me')).toBe('l:L1');
  });

  it('falls back to the muid, then the server id, on own rows', () => {
    expect(renderKey(row({ muid: 'M1' }), 'me')).toBe('m:M1');
    expect(renderKey(row({ id: 9 }), 'me')).toBe('s:9');
  });

  it("another sender's message is keyed by its server id, never its muid", () => {
    expect(renderKey(row({ id: 9, muid: 'colliding', uid: 'sam' }), 'me')).toBe('s:9');
  });
});

describe('drawsUnsentState (UIK-LIFE-03)', () => {
  it('offline on, or a failed (direct) row left by the kill switch; nothing else with offline off', () => {
    const fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    const stranded = msg('stranded', { localMessageId: 'L9', muid: 'M9', status: 'PENDING' });
    const other = msg('other', { localMessageId: 'L8', muid: 'M8', status: 'PENDING' });
    expect(drawsUnsentState(other)).toBe(true);
    hub.markStranded(stranded);
    fake.setEnabled(false);
    expect(drawsUnsentState(stranded)).toBe(true);
    expect(drawsUnsentState(other)).toBe(false);
    fake.restore();
  });
});
