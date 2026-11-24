vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../testing/offline-sdk-fake';
import { HeldReceipts } from '../utils/offline/reconcile';
import { serverIdOf } from '../utils/offline/identity';
import { OfflineHub } from '../utils/offline/offline-hub';
import {
  applyMessageSync,
  applyMessagesUpdated,
  applySendState,
  failStrandedSends,
  fetchAroundOffline,
  fetchNextOffline,
  fetchPreviousOffline,
  markOpeningJump,
  OfflineListContext,
  refreshNewestWindow,
} from './message-list.offline';
import {
  fetchPreviousMessagesImpl,
  fetchMessagesAroundIdImpl,
  handleReceiptImpl,
  applyReceiptToMessage,
} from './message-list.fetch-utils';
import {
  applyFirstServerPage,
  keepLocalReadsCleared,
  reconcileSyncPage,
} from './conversations.offline';
import { CometChatUIKit } from '../cometchat-uikit';
import { handleReconnectionImpl } from './message-list.conversation-utils';
import { MessageListService } from './message-list.service';

function msg(text: string, state: Parameters<typeof offlineMessage>[1] = {}) {
  return offlineMessage(textMessage(text), state);
}

/** A scripted MessagesRequest: each fetch runs the next script with the listener (or answers the Promise form). */
function scriptedRequest(
  scripts: ((listener: any) => void)[],
  promisePage: CometChat.BaseMessage[] = []
) {
  const calls: ('listener' | 'promise')[] = [];
  return {
    calls,
    fetchPrevious(listener?: any) {
      if (!listener) {
        calls.push('promise');
        return Promise.resolve(promisePage);
      }
      calls.push('listener');
      scripts.shift()?.(listener);
      return Promise.reject({ code: 'FAILED_TO_FETCH' });
    },
    fetchNext(listener?: any) {
      return this.fetchPrevious(listener);
    },
  } as any;
}

function makeCtx(
  request: any,
  isForThisChat: (m: CometChat.BaseMessage) => boolean = () => true
): OfflineListContext & Record<string, any> {
  const ctx: any = {
    messagesRequest: request,
    nextMessagesRequest: request,
    fetchGeneration: 0,
    parentMessageId: null,
    isAgentChatMode: false,
    hideGroupActionMessages: false,
    errorCallback: vi.fn(),
    loadingStateSignal: signal(false),
    errorStateSignal: signal<Error | null>(null),
    prevMessageIdSignal: signal(0),
    nextMessageIdSignal: signal(0),
    allMessagesSignal: signal<CometChat.BaseMessage[]>([]),
    messagesSignal: signal<CometChat.BaseMessage[]>([]),
    messageIdMap: new Map(),
    messageMuidMap: new Map(),
    offlineFooterSignal: signal<'none' | 'connect_to_load_more'>('none'),
    heldReceipts: new HeldReceipts(),
    offlinePathUsed: false,
    currentUser: {},
    currentGroup: null,
    DEFAULT_MESSAGE_LIMIT: 30,
    normalizeMessageId: (id: string | number) => Number(id),
    markInitialMessagesAsRead: vi.fn(() => Promise.resolve()),
    buildMessagesRequest: vi.fn(() => request),
    buildNextMessagesRequest: vi.fn(() => request),
    clearMessagesAndState: vi.fn(() => {
      ctx.fetchGeneration++;
      ctx.allMessagesSignal.set([]);
      ctx.messagesSignal.set([]);
    }),
    isMessageForCurrentConversation: isForThisChat,
    applyReceiptToMessage,
  };
  return ctx;
}

const ids = (ctx: any) =>
  ctx
    .allMessagesSignal()
    .map((m: CometChat.BaseMessage) => serverIdOf(m) || (m as any).getLocalMessageId());

describe('message list: two-phase read (offline path)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.useRealTimers();
  });

  it('paints the cached page first, then the server page replaces the same slice in place', async () => {
    let cachedSeen: unknown[] = [];
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([
          msg('a', { id: 1, sentAt: 1 }),
          msg('gone', { id: 2, sentAt: 2 }),
          msg('c', { id: 3, sentAt: 3 }),
        ]);
        cachedSeen = ids(ctx);
        l.onServerMessages([msg('a', { id: 1, sentAt: 1 }), msg('c', { id: 3, sentAt: 3 })]);
      },
    ]);
    const ctx = makeCtx(request);
    const hasMore = await fetchPreviousOffline(ctx);
    expect(cachedSeen).toEqual([1, 2, 3]);
    expect(ids(ctx)).toEqual([1, 3]);
    expect(hasMore).toBe(true);
    expect(ctx.loadingStateSignal()).toBe(false);
    expect(ctx.prevMessageIdSignal()).toBe(1);
    expect(ctx.nextMessageIdSignal()).toBe(3);
  });

  it('a stale cached newest page that does not join the server page is dropped, not stitched over a gap (D13-R2)', async () => {
    let cachedSeen: unknown[] = [];
    const request = scriptedRequest([
      l => {
        // Cached newest page: old 1-3. Meanwhile many arrived: the server newest page is 71-73.
        l.onCachedMessages([1, 2, 3].map(id => msg(`old ${id}`, { id, sentAt: id })));
        cachedSeen = ids(ctx);
        l.onServerMessages([71, 72, 73].map(id => msg(`new ${id}`, { id, sentAt: id })));
      },
    ]);
    const ctx = makeCtx(request);
    ctx.allMessagesSignal.set([
      msg('mine', { localMessageId: 'L', status: 'PENDING', sentAt: 99 }),
    ]);
    await fetchPreviousOffline(ctx);
    expect(cachedSeen).toEqual([1, 2, 3, 'L']);
    expect(ids(ctx)).toEqual([71, 72, 73, 'L']);
    // Older pages continue from the server page's edge, not from the stale cached rows.
    expect(ctx.prevMessageIdSignal()).toBe(71);
  });

  it('a cached page of rows already listed is never dropped, though it does not join the older server page', async () => {
    const request = scriptedRequest([
      l => {
        // The cache read lags the server cursor: it returns the rows already shown.
        l.onCachedMessages([4, 5, 6].map(id => msg(`m${id}`, { id, sentAt: id })));
        l.onServerMessages([1, 2, 3].map(id => msg(`m${id}`, { id, sentAt: id })));
      },
    ]);
    const ctx = makeCtx(request);
    ctx.allMessagesSignal.set([4, 5, 6].map(id => msg(`m${id}`, { id, sentAt: id })));
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('cached rows newer than an older server page that does not join are kept (no gap the cursor has passed)', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([7, 8].map(id => msg(`m${id}`, { id, sentAt: id })));
        l.onServerMessages([1, 2].map(id => msg(`m${id}`, { id, sentAt: id })));
      },
    ]);
    const ctx = makeCtx(request);
    ctx.allMessagesSignal.set([9, 10].map(id => msg(`m${id}`, { id, sentAt: id })));
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 2, 7, 8, 9, 10]);
  });

  it('a cached page that joins the server page keeps its rows below the page (D13-R2)', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([1, 2, 3].map(id => msg(`m${id}`, { id, sentAt: id })));
        l.onServerMessages([3, 4, 5].map(id => msg(`m${id}`, { id, sentAt: id })));
      },
    ]);
    const ctx = makeCtx(request);
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 2, 3, 4, 5]);
  });

  it('offline, an older read with nothing cached marks the history exhausted; one with cached rows does not; a server page clears it', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([msg('a', { id: 1, sentAt: 1 })]);
        l.onError({ code: 'FAILED_TO_FETCH' });
      },
      l => {
        l.onCachedMessages([]);
        l.onError({ code: 'FAILED_TO_FETCH' });
      },
      l => {
        l.onServerMessages([msg('z', { id: 2, sentAt: 2 })]);
      },
    ]);
    const ctx = makeCtx(request);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
    expect(ctx.offlinePreviousExhausted).toBe(false);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlinePreviousExhausted).toBe(true);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlinePreviousExhausted).toBe(false);
  });

  it('an unsent row is never removed by a read (BEH-READ-30)', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([
          msg('a', { id: 1, sentAt: 1 }),
          msg('mine', { localMessageId: 'L', status: 'PENDING', sentAt: 5 }),
        ]);
        l.onServerMessages([msg('a', { id: 1, sentAt: 1 })]);
      },
    ]);
    const ctx = makeCtx(request);
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 'L']);
  });

  it('offline past the cache: cached rows stay, footer "Connect to load more", no error, pagination does not end', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([msg('a', { id: 1, sentAt: 1 })]);
        l.onError({ code: 'FAILED_TO_FETCH' });
      },
    ]);
    const ctx = makeCtx(request);
    const hasMore = await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1]);
    expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
    expect(ctx.errorStateSignal()).toBeNull();
    expect(ctx.errorCallback).not.toHaveBeenCalled();
    expect(hasMore).toBe(false);
  });

  it('a failed read (a server error) keeps the cached rows, reports the error once, and never ends the list (UIK-READ-03, UIT-READ-11)', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([msg('a', { id: 1, sentAt: 1 })]);
        l.onError({ code: 'ERR_INTERNAL_SERVER' });
      },
    ]);
    const ctx = makeCtx(request);
    const hasMore = await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1]);
    expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
    expect(ctx.errorStateSignal()).toBeNull();
    expect(ctx.offlineFooterSignal()).toBe('none');
    // Not "no more messages": the next scroll or tap reads again.
    expect(hasMore).toBe(true);
    expect(ctx.loadingStateSignal()).toBe(false);
  });

  it('a failed read of newer messages never ends that direction either', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([]);
        l.onError({ code: 'ERR_INTERNAL_SERVER' });
      },
    ]);
    const ctx = makeCtx(request);
    expect(await fetchNextOffline(ctx)).toBe(true);
    expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
  });

  describe('D84: one error and offline-state rule for the message list and threads', () => {
    const NOT_CONNECTED = { code: 'FAILED_TO_FETCH' };
    const SERVER_ERROR = { code: 'ERR_INTERNAL_SERVER' };
    const failing = (error: unknown, cached: CometChat.BaseMessage[] = []) =>
      scriptedRequest([
        l => {
          l.onCachedMessages(cached);
          l.onError(error);
        },
      ]);

    it('rule 3: opened offline with nothing saved is "Connect to load messages" (the error state) and one report, not the footer', async () => {
      const ctx: any = makeCtx(failing(NOT_CONNECTED));
      ctx.reportLoadError = vi.fn();
      await fetchPreviousOffline(ctx);
      expect(ctx.errorStateSignal()).toEqual(NOT_CONNECTED);
      expect(ctx.offlineFooterSignal()).toBe('none');
      expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
      // The error view is what reports it: no second report for the same load.
      expect(ctx.reportLoadError).not.toHaveBeenCalled();
      expect(ctx.offlineReloadOnConnect).toBe(true);
      expect(ctx.loadingStateSignal()).toBe(false);
    });

    it('rule 4: a real error with nothing saved is the error view with Retry (not the offline state), and it is not reloaded on reconnect', async () => {
      const ctx: any = makeCtx(failing(SERVER_ERROR));
      await fetchPreviousOffline(ctx);
      expect(ctx.errorStateSignal()).toEqual(SERVER_ERROR);
      expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
      expect(ctx.offlineReloadOnConnect).toBe(false);
    });

    it('rule 2: offline with saved messages on screen, they stay with the "Connect to load more" row and nothing is reported', async () => {
      const ctx: any = makeCtx(failing(NOT_CONNECTED, [msg('a', { id: 1, sentAt: 1 })]));
      ctx.reportLoadError = vi.fn();
      await fetchPreviousOffline(ctx);
      expect(ids(ctx)).toEqual([1]);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
      expect(ctx.reportLoadError).not.toHaveBeenCalled();
      expect(ctx.errorCallback).not.toHaveBeenCalled();
    });

    it('rule 5: a server error over saved messages keeps them and reports once', async () => {
      const ctx: any = makeCtx(failing(SERVER_ERROR, [msg('a', { id: 1, sentAt: 1 })]));
      ctx.reportLoadError = vi.fn();
      await fetchPreviousOffline(ctx);
      expect(ids(ctx)).toEqual([1]);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.reportLoadError).toHaveBeenCalledTimes(1);
    });

    it('rule 2 and 5: a "load more" page (scrolling past what is shown) reports nothing offline and once for an online failure', async () => {
      for (const [error, reports] of [[NOT_CONNECTED, 0], [SERVER_ERROR, 1]] as const) {
        const ctx: any = makeCtx(failing(error));
        ctx.reportLoadError = vi.fn();
        ctx.allMessagesSignal.set([msg('a', { id: 5, sentAt: 5 })]);
        ctx.prevMessageIdSignal.set(5);
        ctx.nextMessageIdSignal.set(5);
        await fetchPreviousOffline(ctx);
        expect(ids(ctx)).toEqual([5]);
        expect(ctx.errorStateSignal()).toBeNull();
        expect(ctx.reportLoadError).toHaveBeenCalledTimes(reports);
      }
    });

    it('rule 5: a jump to a message that fails online reports once for the whole jump', async () => {
      const request = scriptedRequest([
        l => l.onError(SERVER_ERROR),
        l => l.onError(SERVER_ERROR),
      ]);
      const ctx: any = makeCtx(request);
      ctx.reportLoadError = vi.fn();
      fake.singleReads.push(l => {
        l.onCachedMessage(msg('target cached', { id: 40, sentAt: 40 }));
        l.onError(SERVER_ERROR);
      });
      await fetchAroundOffline(ctx, 40);
      expect(ids(ctx)).toEqual([40]);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.reportLoadError).toHaveBeenCalledTimes(1);
    });

    it('rule 3: a jump offline with nothing saved is "Connect to load messages" and one report, not a quiet empty chat', async () => {
      const request = scriptedRequest([l => l.onError(NOT_CONNECTED)]);
      const ctx: any = makeCtx(request);
      fake.connected = false;
      fake.singleReads.push(l => l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' }));
      await fetchAroundOffline(ctx, 40);
      expect(ctx.errorStateSignal()).toEqual(NOT_CONNECTED);
      expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
    });

    it('rule 5: an automatic refresh failing with messages shown stays quiet (no error, no report)', async () => {
      const ctx: any = makeCtx(scriptedRequest([l => l.onError(NOT_CONNECTED)]));
      ctx.reportLoadError = vi.fn();
      ctx.allMessagesSignal.set([msg('a', { id: 1, sentAt: 1 })]);
      await refreshNewestWindow(ctx);
      expect(ctx.reportLoadError).not.toHaveBeenCalled();
      expect(ctx.errorCallback).not.toHaveBeenCalled();
    });

    it('rule 8: reconnect reads the first page once when "Connect to load messages" is up', async () => {
      const service: any = MessageListService.prototype;
      const ctx: any = makeCtx(scriptedRequest([]));
      ctx.offlineReloadOnConnect = true;
      ctx.errorStateSignal.set(NOT_CONNECTED as any);
      ctx.fetchPreviousMessages = vi.fn(() => Promise.resolve(true));
      expect(await service.reloadAfterOfflineError.call(ctx)).toBe(true);
      expect(ctx.fetchPreviousMessages).toHaveBeenCalledTimes(1);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.buildMessagesRequest).toHaveBeenCalledTimes(1);
      // A second reconnect finds the flag spent: no second read.
      expect(await service.reloadAfterOfflineError.call(ctx)).toBe(false);
      expect(ctx.fetchPreviousMessages).toHaveBeenCalledTimes(1);
    });

    it('rule 8: reconnect does not read again after a non-network error, or over messages on screen', async () => {
      const service: any = MessageListService.prototype;
      const ctx: any = makeCtx(scriptedRequest([]));
      ctx.fetchPreviousMessages = vi.fn(() => Promise.resolve(true));
      ctx.errorStateSignal.set(SERVER_ERROR as any);
      ctx.offlineReloadOnConnect = false;
      expect(await service.reloadAfterOfflineError.call(ctx)).toBe(false);
      ctx.offlineReloadOnConnect = true;
      ctx.allMessagesSignal.set([msg('a', { id: 1, sentAt: 1 })]);
      expect(await service.reloadAfterOfflineError.call(ctx)).toBe(false);
      expect(ctx.fetchPreviousMessages).not.toHaveBeenCalled();
    });

    it('rule 8: the connection coming back asks the list to reload, with offline on', async () => {
      const ctx: any = makeCtx(scriptedRequest([]));
      ctx.reloadAfterOfflineError = vi.fn(() => Promise.resolve(true));
      ctx.markOfflineConnected = vi.fn();
      await handleReconnectionImpl(ctx);
      expect(ctx.reloadAfterOfflineError).toHaveBeenCalledTimes(1);
    });

    it('rule 8: with that reload failing again offline with nothing shown, "Connect to load messages" stays up', async () => {
      const service: any = MessageListService.prototype;
      const ctx: any = makeCtx(failing(NOT_CONNECTED));
      ctx.offlineReloadOnConnect = true;
      ctx.errorStateSignal.set(NOT_CONNECTED as any);
      ctx.fetchPreviousMessages = () => fetchPreviousOffline(ctx);
      await service.reloadAfterOfflineError.call(ctx);
      expect(ctx.errorStateSignal()).toEqual(NOT_CONNECTED);
      expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
      expect(ctx.offlineReloadOnConnect).toBe(true);
    });

    it('rule 5: an empty server page is not an error', async () => {
      const ctx: any = makeCtx(scriptedRequest([l => l.onServerMessages([])]));
      await fetchPreviousOffline(ctx);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.errorCallback).not.toHaveBeenCalled();
    });
  });

  it('only an empty server page ends pagination; an empty cached page does not', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([]);
        l.onServerMessages([]);
      },
    ]);
    const ctx = makeCtx(request);
    expect(await fetchPreviousOffline(ctx)).toBe(false);
    const request2 = scriptedRequest([
      l => {
        l.onCachedMessages([]);
        l.onServerMessages([msg('a', { id: 9, sentAt: 9 })]);
      },
    ]);
    expect(await fetchPreviousOffline(makeCtx(request2))).toBe(true);
  });

  it('a page of an older read (chat switched) never touches the screen', async () => {
    let listener: any;
    const request = scriptedRequest([
      l => {
        listener = l;
      },
    ]);
    const ctx = makeCtx(request);
    const pending = fetchPreviousOffline(ctx);
    ctx.fetchGeneration++;
    listener.onCachedMessages([msg('old chat', { id: 1, sentAt: 1 })]);
    listener.onServerMessages([msg('old chat', { id: 1, sentAt: 1 })]);
    expect(await pending).toBe(false);
    expect(ctx.allMessagesSignal()).toHaveLength(0);
  });

  it('never hangs: an SDK that resolves its Promise without calling the listener still ends the read (P6)', async () => {
    const page = [msg('a', { id: 1, sentAt: 1 })];
    const request = {
      fetchPrevious: vi.fn(() => Promise.resolve(page)),
      fetchNext: vi.fn(() => Promise.resolve(page)),
    } as any;
    const ctx = makeCtx(request);
    const more = await fetchPreviousOffline(ctx);
    expect(more).toBe(true);
    expect(ctx.loadingStateSignal()).toBe(false);
    expect(ids(ctx)).toEqual([1]);
  });

  it('jump to a message: the target comes two-phase from getMessageDetails when the page before it is empty (BEH-READ-35, UIT-READ-08)', async () => {
    const request = scriptedRequest([
      l => l.onServerMessages([]),
      l => l.onServerMessages([msg('after', { id: 41, sentAt: 41 })]),
    ]);
    const ctx = makeCtx(request);
    fake.singleReads.push(l => {
      l.onCachedMessage(msg('target cached', { id: 40, sentAt: 40 }));
      l.onServerMessage(msg('target', { id: 40, sentAt: 40 }));
    });
    await fetchAroundOffline(ctx, 40);
    expect(ids(ctx)).toEqual([40, 41]);
    const [[id, listener]] = fake.callsTo('getMessageDetails') as any;
    expect(id).toBe(40);
    expect(typeof listener.onServerMessage).toBe('function');
  });

  it('jump to a message offline: the cached target shows; a never-cached one is simply absent, no error', async () => {
    const request = scriptedRequest([
      l => l.onError({ code: 'FAILED_TO_FETCH' }),
      l => l.onError({ code: 'FAILED_TO_FETCH' }),
    ]);
    const ctx = makeCtx(request);
    fake.singleReads.push(l => {
      l.onCachedMessage(msg('target cached', { id: 40, sentAt: 40 }));
      l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    });
    await fetchAroundOffline(ctx, 40);
    expect(ids(ctx)).toEqual([40]);
    expect(ctx.errorStateSignal()).toBeNull();
  });

  it("with offline off the fetch keeps today's single Promise read", async () => {
    fake.setEnabled(false);
    const request = scriptedRequest([], [msg('a', { id: 1, sentAt: 1 })]);
    const ctx = makeCtx(request);
    await fetchPreviousMessagesImpl(ctx as any);
    expect(request.calls).toEqual(['promise']);
  });

  it('with offline on the fetch uses the listener form', async () => {
    const request = scriptedRequest([l => l.onServerMessages([])]);
    await fetchPreviousMessagesImpl(makeCtx(request) as any);
    expect(request.calls).toEqual(['listener']);
  });
});

describe('message list: sends, sync and receipts (offline path)', () => {
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

  const event = (message: CometChat.BaseMessage, state: any) => ({
    gen: OfflineHub.getInstance().gen,
    localMessageId: (message as any).getLocalMessageId(),
    message,
    state,
  });

  it('the ack replaces the pending row in place; a discard removes it', () => {
    const ctx = makeCtx(scriptedRequest([]));
    ctx.allMessagesSignal.set([
      msg('a', { id: 1, sentAt: 1 }),
      msg('hi', { muid: 'M', sentAt: 5 }),
    ]);
    applySendState(
      ctx,
      event(msg('hi', { muid: 'M', localMessageId: 'L', status: 'PENDING', sentAt: 5 }), 'sending')
    );
    expect(ids(ctx)).toEqual([1, 'L']);
    applySendState(
      ctx,
      event(msg('hi', { id: 2, muid: 'M', localMessageId: 'L', status: 'SENT', sentAt: 6 }), 'sent')
    );
    expect(ids(ctx)).toEqual([1, 2]);
    applySendState(ctx, event(msg('x', { muid: 'Q', localMessageId: 'L9', sentAt: 9 }), 'sending'));
    applySendState(ctx, event(msg('x', { muid: 'Q', localMessageId: 'L9' }), 'discarded'));
    expect(ids(ctx)).toEqual([1, 2]);
  });

  it('the ack keeps the thread-subscribed flag and the quoted message the kit stamped on the pending row (D4)', () => {
    const ctx = makeCtx(scriptedRequest([]));
    const quoted = msg('quoted', { id: 3 });
    const pending: any = msg('reply', { localMessageId: 'L1', muid: 'M1', status: 'PENDING' });
    const subscribed = true;
    pending.isThreadSubscribed = () => subscribed;
    pending.getQuotedMessage = () => quoted;
    ctx.allMessagesSignal.set([pending]);
    const acked: any = msg('reply', { id: 50, localMessageId: 'L1', muid: 'M1', status: 'SENT' });
    let ackSubscribed = false;
    let ackQuoted: unknown;
    acked.isThreadSubscribed = () => ackSubscribed;
    acked.setThreadSubscribed = (v: boolean) => {
      ackSubscribed = v;
    };
    acked.getQuotedMessage = () => ackQuoted;
    acked.setQuotedMessage = (q: unknown) => {
      ackQuoted = q;
    };
    applySendState(ctx, {
      gen: OfflineHub.getInstance().gen,
      state: 'sent',
      message: acked,
      localMessageId: 'L1',
    } as any);
    const row: any = ctx.allMessagesSignal()[0];
    expect(serverIdOf(row)).toBe(50);
    expect(row.isThreadSubscribed()).toBe(true);
    expect(row.getQuotedMessage()).toBe(quoted);
    void subscribed;
  });

  it('a retry turns a FAILED row back to pending (fresh reference for OnPush)', () => {
    const ctx = makeCtx(scriptedRequest([]));
    const failed = msg('hi', { muid: 'M', localMessageId: 'L', status: 'FAILED', sentAt: 5 });
    ctx.allMessagesSignal.set([failed]);
    applySendState(ctx, event(failed, 'sending'));
    const row: any = ctx.allMessagesSignal()[0];
    expect(row).not.toBe(failed);
    expect(row.getStatus()).toBe('PENDING');
  });

  it('events of another chat or an older session are ignored', () => {
    const ctx = makeCtx(scriptedRequest([]), () => false);
    applySendState(ctx, event(msg('x', { localMessageId: 'L' }), 'sending'));
    expect(ctx.allMessagesSignal()).toHaveLength(0);
    const ctx2 = makeCtx(scriptedRequest([]));
    applySendState(ctx2, { ...event(msg('x', { localMessageId: 'L' }), 'sending'), gen: -1 });
    expect(ctx2.allMessagesSignal()).toHaveLength(0);
  });

  it("the sweep upserts this chat's messages in sorted place, including action rows", () => {
    const ctx = makeCtx(scriptedRequest([]));
    ctx.allMessagesSignal.set([msg('a', { id: 1, sentAt: 1 }), msg('c', { id: 3, sentAt: 3 })]);
    const action = offlineMessage(new CometChat.Action('g', 'joined', 'group', 'action' as any) as any, {
      id: 2,
      sentAt: 2,
    });
    applyMessageSync(ctx, {
      gen: OfflineHub.getInstance().gen,
      messages: [action],
      outcome: 'CAUGHT_UP',
    });
    expect(ids(ctx)).toEqual([1, 2, 3]);
  });

  it('a PARTIAL sweep refreshes the newest window once', () => {
    const request = scriptedRequest([l => l.onServerMessages([])]);
    const ctx = makeCtx(request);
    applyMessageSync(ctx, { gen: OfflineHub.getInstance().gen, messages: [], outcome: 'PARTIAL' });
    expect(request.calls).toEqual(['listener']);
  });

  it('an automatic newest-window refresh that fails with rows shown stays quiet (no error, no footer)', async () => {
    for (const code of ['FAILED_TO_FETCH', 'ERR_INTERNAL_SERVER']) {
      const request = scriptedRequest([l => l.onError({ code })]);
      const ctx: any = makeCtx(request);
      ctx.allMessagesSignal.set([msg('a', { id: 1, sentAt: 1 })]);
      await refreshNewestWindow(ctx);
      expect(ids(ctx)).toEqual([1]);
      expect(ctx.errorCallback).not.toHaveBeenCalled();
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.offlineFooterSignal()).toBe('none');
      expect(ctx.loadingStateSignal()).toBe(false);
    }
  });

  it('an automatic newest-window refresh with nothing shown keeps the error report', async () => {
    const request = scriptedRequest([l => l.onError({ code: 'ERR_INTERNAL_SERVER' })]);
    const ctx: any = makeCtx(request);
    await refreshNewestWindow(ctx);
    expect(ctx.errorCallback).toHaveBeenCalledTimes(1);
  });

  it('a PARTIAL sweep whose newest window does not overlap resets the list and signals "jump to latest" (UIT-SYNC-04)', async () => {
    const shown = [msg('old 1', { id: 1, sentAt: 1 }), msg('old 2', { id: 2, sentAt: 2 })];
    const newest = [msg('new 50', { id: 50, sentAt: 50 }), msg('new 51', { id: 51, sentAt: 51 })];
    const request = scriptedRequest([l => l.onServerMessages(newest)]);
    const ctx: any = makeCtx(request);
    ctx.newestWindowResetSignal = signal(0);
    ctx.allMessagesSignal.set(shown);
    await refreshNewestWindow(ctx);
    expect(ids(ctx)).toEqual([50, 51]);
    expect(ctx.newestWindowResetSignal()).toBe(1);
  });

  it('onMessagesSynced updates rows shown and never inserts (BEH-INV-11)', () => {
    const ctx = makeCtx(scriptedRequest([]));
    ctx.allMessagesSignal.set([msg('a', { id: 1, sentAt: 1, updatedAt: 1 })]);
    applyMessagesUpdated(ctx, {
      gen: OfflineHub.getInstance().gen,
      messages: [
        msg('a edited', { id: 1, sentAt: 1, updatedAt: 2 }),
        msg('new', { id: 5, sentAt: 5 }),
      ],
    });
    expect(ids(ctx)).toEqual([1]);
    expect((ctx.allMessagesSignal()[0] as CometChat.TextMessage).getText()).toBe('a edited');
  });

  it('kill switch: stranded un-acked rows turn failed (direct) with one notice', () => {
    const ctx = makeCtx(scriptedRequest([]));
    ctx.offlinePathUsed = true;
    ctx.allMessagesSignal.set([
      msg('a', { id: 1 }),
      msg('u1', { localMessageId: 'L1', muid: 'M1', status: 'PENDING' }),
      msg('u2', { localMessageId: 'L2', muid: 'M2', status: 'PENDING' }),
    ]);
    const notices: any[] = [];
    const sub = OfflineHub.getInstance().notice$.subscribe(n => notices.push(n));
    failStrandedSends(ctx);
    sub.unsubscribe();
    expect(notices).toMatchObject([{ kind: 'messages_not_sent', count: 2 }]);
    expect(OfflineHub.getInstance().directFailureOf(ctx.allMessagesSignal()[1])).toBeDefined();
  });

  it('the kill switch says which list its notice is for', () => {
    // One notice covers them all, so it carries one of the rows: that is how a
    // list tells whether the notice is its own (see the A1 parity spec).
    const ctx = makeCtx(scriptedRequest([]));
    ctx.offlinePathUsed = true;
    const stranded = msg('u1', { localMessageId: 'L1', muid: 'M1', status: 'PENDING' });
    ctx.allMessagesSignal.set([msg('a', { id: 1 }), stranded]);
    const notices: any[] = [];
    const sub = OfflineHub.getInstance().notice$.subscribe(n => notices.push(n));

    failStrandedSends(ctx);
    sub.unsubscribe();

    expect(notices).toHaveLength(1);
    expect(notices[0].scopeMessage).toBe(stranded);
    // Not `message`: there is no single removed message to copy here.
    expect(notices[0].message).toBeUndefined();
  });

  it('kill switch at the next fetch: a read with offline off first fails the stranded rows', async () => {
    const request = scriptedRequest([]);
    const ctx = makeCtx(request);
    ctx.offlinePathUsed = true;
    ctx.allMessagesSignal.set([msg('u1', { localMessageId: 'L1', muid: 'M1', status: 'PENDING' })]);
    fake.setEnabled(false);
    await fetchPreviousMessagesImpl(ctx as any).catch(() => undefined);
    expect(OfflineHub.getInstance().directFailureOf(ctx.allMessagesSignal()[0])).toBeDefined();
    expect(request.calls).toEqual(['promise']);
  });

  it('reconnect with offline on makes no fetch of its own: the SDK sweep catches up (UIK-SYNC-01)', async () => {
    const request = scriptedRequest([]);
    const ctx: any = makeCtx(request);
    ctx.nextMessageIdSignal.set(5);
    ctx.fetchNextMessages = vi.fn(() => Promise.resolve(true));
    ctx.fetchPreviousMessages = vi.fn(() => Promise.resolve(true));
    await handleReconnectionImpl(ctx);
    expect(ctx.fetchNextMessages).not.toHaveBeenCalled();
    expect(ctx.fetchPreviousMessages).not.toHaveBeenCalled();
    expect(ctx.buildNextMessagesRequest).not.toHaveBeenCalled();
  });

  it("reconnect with offline off keeps today's catch-up fetch, and a list whose first fetch failed loads its first page (D2)", async () => {
    fake.setEnabled(false);
    const ctx: any = makeCtx(scriptedRequest([]));
    ctx.fetchNextMessages = vi.fn(() => Promise.resolve(true));
    ctx.fetchPreviousMessages = vi.fn(() => Promise.resolve(true));
    ctx.nextMessageIdSignal.set(5);
    await handleReconnectionImpl(ctx);
    expect(ctx.fetchNextMessages).toHaveBeenCalledTimes(1);
    ctx.nextMessageIdSignal.set(0);
    ctx.errorStateSignal.set(new Error('first fetch failed'));
    await handleReconnectionImpl(ctx);
    expect(ctx.fetchPreviousMessages).toHaveBeenCalledTimes(1);
    // The recovery clears the old error, or the error view would stay over the rows.
    expect(ctx.errorStateSignal()).toBeNull();
    ctx.errorStateSignal.set(new Error('first fetch failed'));
    ctx.allMessagesSignal.set([msg('only unsent', { localMessageId: 'L9' })]);
    await handleReconnectionImpl(ctx);
    expect(ctx.fetchPreviousMessages).toHaveBeenCalledTimes(1);
  });

  it('reconnect with offline off: a chat that loaded fine and is empty makes no request', async () => {
    fake.setEnabled(false);
    const ctx: any = makeCtx(scriptedRequest([]));
    ctx.fetchNextMessages = vi.fn(() => Promise.resolve(true));
    ctx.fetchPreviousMessages = vi.fn(() => Promise.resolve(true));
    await handleReconnectionImpl(ctx);
    expect(ctx.fetchPreviousMessages).not.toHaveBeenCalled();
    expect(ctx.fetchNextMessages).not.toHaveBeenCalled();
    expect(ctx.buildMessagesRequest).not.toHaveBeenCalled();
  });

  it("kill switch on reconnect: offline switched off under rows drawn offline runs the list's check, then today's catch-up", async () => {
    fake.setEnabled(false);
    const ctx: any = makeCtx(scriptedRequest([]));
    ctx.checkKillSwitch = vi.fn();
    ctx.fetchNextMessages = vi.fn(() => Promise.resolve(true));
    ctx.nextMessageIdSignal.set(5);
    await handleReconnectionImpl(ctx);
    expect(ctx.checkKillSwitch).toHaveBeenCalledTimes(1);
    expect(ctx.fetchNextMessages).toHaveBeenCalledTimes(1);
  });

  it('a receipt never marks an unsent row, and an early receipt is held until the ack', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue({ getUid: () => 'me' } as any);
    const ctx: any = makeCtx(scriptedRequest([]));
    const me = { getUid: () => 'me' } as any;
    const sentRow = msg('a', { id: 1, sentAt: 1 });
    sentRow.setSender(me);
    const pending = msg('b', { localMessageId: 'L', muid: 'M', status: 'PENDING', sentAt: 2 });
    pending.setSender(me);
    ctx.allMessagesSignal.set([sentRow, pending]);
    ctx.messagesSignal.set([sentRow, pending]);
    const receipt: any = {
      getMessageId: () => '2',
      getReadAt: () => 100,
      getDeliveredAt: () => 100,
    };
    handleReceiptImpl(ctx, receipt, false);
    expect(ctx.allMessagesSignal()[1].getReadAt()).toBeFalsy();
    expect(ctx.allMessagesSignal()[0].getReadAt()).toBe(100);
    const ack = msg('b', { id: 2, localMessageId: 'L', muid: 'M', status: 'SENT', sentAt: 2 });
    ack.setSender(me);
    applySendState(ctx, event(ack, 'sent'));
    expect(ctx.allMessagesSignal()[1].getReadAt()).toBe(100);
  });
});

describe('conversation list: sync reconcile (offline path)', () => {
  const conv = (id: string, updatedAt: number, last?: CometChat.BaseMessage) =>
    ({
      getConversationId: () => id,
      getConversationWith: () => new CometChat.User(id),
      getConversationType: () => 'user',
      getUpdatedAt: () => updatedAt,
      getLastMessage: () => last,
    }) as any as CometChat.Conversation;
  const names = (list: CometChat.Conversation[]) => list.map(c => c.getConversationId());

  it('reconciles only the slice the sync page covers; rows below it stay', () => {
    const current = [conv('a', 50), conv('stale', 48), conv('b', 30), conv('old', 5)];
    const page = [conv('b', 60), conv('a', 50), conv('new', 45)];
    expect(names(reconcileSyncPage(current, page))).toEqual(['b', 'a', 'new', 'old']);
  });

  it('never drops a chat whose preview is an own unsent message', () => {
    const unsent = msg('hi', { localMessageId: 'L', status: 'PENDING' });
    const current = [conv('mine', 70, unsent), conv('a', 50)];
    expect(names(reconcileSyncPage(current, [conv('a', 50)]))).toEqual(['mine', 'a']);
    expect(names(applyFirstServerPage(current, [conv('a', 50)]))).toEqual(['mine', 'a']);
  });

  it('the first server page replaces the cached rows', () => {
    expect(names(applyFirstServerPage([conv('gone', 10), conv('a', 5)], [conv('a', 6)]))).toEqual([
      'a',
    ]);
  });

  /**
   * A sync page is a snapshot of what the server knew when the sync was asked
   * for, so it cannot account for a chat that arrived after it (Aanshi's D2 on
   * #674). The SDK guards the same case with its dispatch-sequence check
   * (R156, SyncEngine.ts).
   */
  describe('a chat that arrives live while the sync is in flight', () => {
    /** A row this device built from a live message: no server updatedAt at all. */
    const liveConv = (id: string, sentAt: number) =>
      ({
        getConversationId: () => id,
        getConversationWith: () => new CometChat.User(id),
        getConversationType: () => 'user',
        getLastMessage: () => ({ getSentAt: () => sentAt, getId: () => 1 }),
      }) as any as CometChat.Conversation;

    it('is kept, not dropped, although its message is recent', () => {
      // A new contact messages the user mid-reconnect; the page predates it.
      const current = [liveConv('newcontact', 55), conv('a', 50), conv('old', 5)];
      const page = [conv('a', 50), conv('b', 45)];

      expect(names(reconcileSyncPage(current, page))).toEqual(['newcontact', 'a', 'b', 'old']);
    });

    it('is ordered by the message it arrived with, not by a timestamp it has none of', () => {
      const current = [conv('a', 50), liveConv('newcontact', 55)];
      const page = [conv('a', 50), conv('b', 45)];

      expect(names(reconcileSyncPage(current, page))[0]).toBe('newcontact');
    });

    it('keeps a known chat whose live message is newer than the whole page', () => {
      // The server row is inside the page's range and the page omits it, but
      // this device saw a message for it after the snapshot was taken.
      const fresh = {
        getConversationId: () => 'known',
        getConversationWith: () => new CometChat.User('known'),
        getConversationType: () => 'user',
        getUpdatedAt: () => 48,
        getLastMessage: () => ({ getSentAt: () => 70, getId: () => 2 }),
      } as any as CometChat.Conversation;
      const page = [conv('a', 60), conv('b', 45)];

      expect(names(reconcileSyncPage([fresh, conv('a', 60)], page))).toEqual(['known', 'a', 'b']);
    });

    it('still drops a row the page has moved on from', () => {
      // No live activity: its newest sign of life is the server's own stale
      // timestamp inside the page's range, so the page speaks for it.
      const current = [conv('a', 60), conv('stale', 48), conv('b', 45)];
      const page = [conv('a', 60), conv('b', 45)];

      expect(names(reconcileSyncPage(current, page))).toEqual(['a', 'b']);
    });

    it('orders a row by its last message when the server timestamp is stale', () => {
      // A live message never bumps updatedAt, so ordering on updatedAt alone
      // left a chat that had just been written to below older ones.
      const touched = {
        getConversationId: () => 'touched',
        getConversationWith: () => new CometChat.User('touched'),
        getConversationType: () => 'user',
        getUpdatedAt: () => 10,
        getLastMessage: () => ({ getSentAt: () => 90, getId: () => 3 }),
      } as any as CometChat.Conversation;

      expect(names(reconcileSyncPage([conv('a', 60), touched], [conv('a', 60)]))).toEqual([
        'touched',
        'a',
      ]);
    });
  });
});

describe('kill switch: a row a conversation preview turned failed still counts in the one notice (UIK-LIFE-03)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('counts both rows once', () => {
    const hub = OfflineHub.getInstance();
    const notices: (number | undefined)[] = [];
    const sub = hub.notice$.subscribe(n => notices.push(n.count));
    const ctx: any = makeCtx(scriptedRequest([]));
    ctx.offlinePathUsed = true;
    const one = msg('one', { localMessageId: 'L1', muid: 'M1', status: 'PENDING' });
    const two = msg('two', { localMessageId: 'L2', muid: 'M2', status: 'PENDING' });
    ctx.allMessagesSignal.set([one, two]);
    hub.markStranded(two);
    failStrandedSends(ctx);
    failStrandedSends(ctx);
    expect(notices).toEqual([2]);
    sub.unsubscribe();
  });
});

/**
 * ENG-57322: a jump (quoted reply, search result, go to message) to a message that is not saved,
 * from a chat with rows on screen, keeps those rows exactly, as on Android
 * (MessageListOfflineReads.kt @ca5b4e18 :682-691, showRowsOrError :375-383): the target is looked
 * up first and the rows are replaced only once it is found. It does not matter whether the SDK has
 * noticed the lost connection yet (the JS SDK takes ~15-18 s).
 */
describe('ENG-57322: a jump to a message that is not saved keeps the rows on screen', () => {
  const NOT_CONNECTED = { code: 'FAILED_TO_FETCH' };
  const SERVER_ERROR = { code: 'ERR_INTERNAL_SERVER' };
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  /** A chat showing rows 1-3 with the older edge at "Connect to load more"; `request` answers paging. */
  function onScreen(request: any = scriptedRequest([])) {
    const ctx: any = makeCtx(request);
    ctx.reportLoadError = vi.fn();
    ctx.allMessagesSignal.set([1, 2, 3].map(id => msg(`m${id}`, { id, sentAt: id })));
    ctx.offlineFooterSignal.set('connect_to_load_more');
    ctx.offlineBlocked = { previous: true, next: false };
    return ctx;
  }

  for (const connected of [true, false]) {
    it(`keeps the rows, with no loader, no error and no report (SDK reports ${connected ? 'connected' : 'disconnected'})`, async () => {
      const request = scriptedRequest([]);
      const ctx = onScreen(request);
      const rows = ctx.allMessagesSignal();
      fake.connected = connected;
      fake.singleReads.push(l => l.onError(NOT_CONNECTED));
      await fetchAroundOffline(ctx, 99);
      expect(ctx.allMessagesSignal()).toBe(rows);
      expect(ctx.clearMessagesAndState).not.toHaveBeenCalled();
      expect(ctx.fetchGeneration).toBe(0);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.reportLoadError).not.toHaveBeenCalled();
      expect(ctx.errorCallback).not.toHaveBeenCalled();
      // No window read, and the paging state is the one from before the jump.
      expect(request.calls).toEqual([]);
      expect(ctx.messagesRequest).toBe(request);
      expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
      expect(ctx.offlineBlocked).toEqual({ previous: true, next: false });
      // The jump is never retried by itself: nothing marks the list for a reload on reconnect.
      expect(ctx.offlineReloadOnConnect).toBeFalsy();
    });
  }

  it('a real error keeps the rows and reports once', async () => {
    const ctx = onScreen();
    const rows = ctx.allMessagesSignal();
    fake.singleReads.push(l => l.onError(SERVER_ERROR));
    await fetchAroundOffline(ctx, 99);
    expect(ctx.allMessagesSignal()).toBe(rows);
    expect(ctx.errorStateSignal()).toBeNull();
    expect(ctx.loadingStateSignal()).toBe(false);
    expect(ctx.reportLoadError).toHaveBeenCalledTimes(1);
    expect(ctx.reportLoadError).toHaveBeenCalledWith(SERVER_ERROR);
  });

  it('the rows stay while the target is looked up and are replaced once it is found', async () => {
    const request = scriptedRequest([
      l => l.onServerMessages([msg('before', { id: 39, sentAt: 39 })]),
      l => l.onServerMessages([msg('after', { id: 41, sentAt: 41 })]),
    ]);
    const ctx = onScreen(request);
    let answer: any;
    // The lookup stays pending until the test answers it (the fake settles its Promise at once).
    const details = vi.spyOn(CometChat as any, 'getMessageDetails').mockImplementation((_id: any, l: any) => {
      answer = l;
      return new Promise(() => undefined);
    });
    const jump = fetchAroundOffline(ctx, 40);
    await Promise.resolve();
    expect(ids(ctx)).toEqual([1, 2, 3]);
    expect(ctx.loadingStateSignal()).toBe(false);
    answer.onServerMessage(msg('target', { id: 40, sentAt: 40 }));
    await jump;
    details.mockRestore();
    expect(ctx.clearMessagesAndState).toHaveBeenCalledTimes(1);
    expect(ids(ctx)).toEqual([39, 40, 41]);
    expect(ctx.loadingStateSignal()).toBe(false);
  });

  it('paging still works after the kept-rows jump', async () => {
    const request = scriptedRequest([
      l => l.onServerMessages([msg('older', { id: 1, sentAt: 1 })]),
    ]);
    const ctx = onScreen(request);
    ctx.allMessagesSignal.set([2, 3, 4].map(id => msg(`m${id}`, { id, sentAt: id })));
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 99);
    expect(await fetchPreviousOffline(ctx)).toBe(true);
    expect(request.calls).toEqual(['listener']);
    expect(ids(ctx)).toEqual([1, 2, 3, 4]);
  });

  it('a later jump wins over an earlier one still looking up its target', async () => {
    const request = scriptedRequest([
      l => l.onServerMessages([]),
      l => l.onServerMessages([]),
    ]);
    const ctx = onScreen(request);
    let first: any;
    const details = vi.spyOn(CometChat as any, 'getMessageDetails').mockImplementation((id: any, l: any) => {
      if (id === 40) {
        first = l;
        return new Promise(() => undefined);
      }
      l.onServerMessage(msg('second', { id: 50, sentAt: 50 }));
      return new Promise(() => undefined);
    });
    const one = fetchAroundOffline(ctx, 40);
    await fetchAroundOffline(ctx, 50);
    first.onServerMessage(msg('first', { id: 40, sentAt: 40 }));
    await one;
    details.mockRestore();
    expect(ids(ctx)).toEqual([50]);
    expect(ctx.clearMessagesAndState).toHaveBeenCalledTimes(1);
  });

  it('an opening jump (empty list) to a target that is not saved reads the newest page even while the SDK still reports connected', async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([msg('newest saved', { id: 5, sentAt: 5 })]);
        l.onError(NOT_CONNECTED);
      },
    ]);
    const ctx: any = makeCtx(request);
    ctx.reportLoadError = vi.fn();
    fake.connected = true;
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 40);
    expect(ctx.buildMessagesRequest).toHaveBeenCalledWith();
    expect(ctx.buildMessagesRequest).not.toHaveBeenCalledWith(40);
    expect(ids(ctx)).toEqual([5]);
    expect(ctx.errorStateSignal()).toBeNull();
    expect(ctx.loadingStateSignal()).toBe(false);
    expect(ctx.reportLoadError).not.toHaveBeenCalled();
  });

  it("the open's own jump (start from unread) replaces the newest page; the mark is used once", async () => {
    const request = scriptedRequest([
      l => {
        l.onCachedMessages([msg('newest saved', { id: 5, sentAt: 5 })]);
        l.onError(NOT_CONNECTED);
      },
    ]);
    const ctx = onScreen(request);
    markOpeningJump(ctx);
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 40);
    expect(ctx.clearMessagesAndState).toHaveBeenCalledTimes(1);
    expect(ctx.buildMessagesRequest).toHaveBeenCalledWith();
    expect(ids(ctx)).toEqual([5]);
    // A later jump from these rows is not the open's: a target that cannot be read keeps them.
    const rows = ctx.allMessagesSignal();
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 41);
    expect(ctx.allMessagesSignal()).toBe(rows);
    expect(ctx.clearMessagesAndState).toHaveBeenCalledTimes(1);
  });

  it('an opening jump whose target fails with a real error lands on the newest page and reports once', async () => {
    for (const newestFails of [false, true]) {
      const request = scriptedRequest([
        l => {
          l.onCachedMessages([msg('newest saved', { id: 5, sentAt: 5 })]);
          if (newestFails) l.onError(SERVER_ERROR);
          else l.onServerMessages([msg('newest', { id: 5, sentAt: 5 })]);
        },
      ]);
      const ctx: any = makeCtx(request);
      ctx.reportLoadError = vi.fn();
      fake.singleReads.push(l => l.onError(SERVER_ERROR));
      await fetchAroundOffline(ctx, 40);
      expect(ids(ctx)).toEqual([5]);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ctx.reportLoadError).toHaveBeenCalledTimes(1);
      expect(ctx.reportLoadError).toHaveBeenCalledWith(SERVER_ERROR);
    }
  });

  it('an opening jump whose target fails with a real error, with nothing to show, is the error view and no second report', async () => {
    for (const newest of ['fails', 'empty'] as const) {
      const request = scriptedRequest([
        l => {
          l.onCachedMessages([]);
          if (newest === 'fails') l.onError(SERVER_ERROR);
          else l.onServerMessages([]);
        },
      ]);
      const ctx: any = makeCtx(request);
      ctx.reportLoadError = vi.fn();
      const targetError = { code: 'ERR_MESSAGE_NOT_FOUND' };
      fake.singleReads.push(l => l.onError(targetError));
      await fetchAroundOffline(ctx, 40);
      expect(ids(ctx)).toEqual([]);
      // The error view reports it (the list's `error` output follows the error state).
      expect(ctx.errorStateSignal()).toEqual(newest === 'fails' ? SERVER_ERROR : targetError);
      expect(ctx.reportLoadError).not.toHaveBeenCalled();
      expect(ctx.loadingStateSignal()).toBe(false);
    }
  });

  it('an opening jump whose target is only not reachable reports nothing', async () => {
    const request = scriptedRequest([l => l.onServerMessages([msg('newest', { id: 5, sentAt: 5 })])]);
    const ctx: any = makeCtx(request);
    ctx.reportLoadError = vi.fn();
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 40);
    expect(ids(ctx)).toEqual([5]);
    expect(ctx.reportLoadError).not.toHaveBeenCalled();
  });

  it('an opening-jump mark that was undone does not make a later jump replace the rows', async () => {
    const ctx = onScreen();
    const rows = ctx.allMessagesSignal();
    const unmark = markOpeningJump(ctx);
    unmark();
    fake.singleReads.push(l => l.onError(NOT_CONNECTED));
    await fetchAroundOffline(ctx, 41);
    expect(ctx.allMessagesSignal()).toBe(rows);
    expect(ctx.clearMessagesAndState).not.toHaveBeenCalled();
  });

  it('with offline off a jump is unchanged: the list is cleared and read around the id', async () => {
    fake.setEnabled(false);
    const before = msg('before', { id: 39, sentAt: 39 });
    const after = msg('after', { id: 41, sentAt: 41 });
    const request: any = {
      fetchPrevious: vi.fn(() => Promise.resolve([before])),
      fetchNext: vi.fn(() => Promise.resolve([after])),
    };
    const ctx: any = makeCtx(request);
    ctx.allMessagesSignal.set([msg('m1', { id: 1, sentAt: 1 })]);
    ctx.processMessages = (m: any) => m;
    ctx.deduplicateMessages = (m: any) => m;
    await fetchMessagesAroundIdImpl(ctx, 40);
    expect(ctx.clearMessagesAndState).toHaveBeenCalledTimes(1);
    expect(ctx.buildMessagesRequest).toHaveBeenCalledWith(40);
    expect(request.fetchPrevious).toHaveBeenCalledWith();
  });
  /**
   * A chat read while offline must not get its badge back on reconnect
   * (AC-7.4, Aanshi's D3 on #674). The SDK's conversation phase finishes
   * before the message phase whose completion flushes the read receipts, so
   * the sync page still carries the server's pre-read count.
   */
  describe('a chat read while this device was offline', () => {
    /** A server row that still counts the messages the user has already read. */
    const unread = (id: string, count: number) => {
      let value = count;
      return {
        getConversationId: () => id,
        getConversationWith: () => new CometChat.User(id),
        getConversationType: () => 'user',
        getUpdatedAt: () => 50,
        getLastMessage: () => undefined,
        getUnreadMessageCount: () => value,
        setUnreadMessageCount: (next: number) => {
          value = next;
        },
      } as any as CometChat.Conversation;
    };
    const readLocally = (...ids: string[]) => (id: string, type: string) =>
      type === 'user' && ids.includes(id);

    it('keeps its badge off when the sync page brings the old count back', () => {
      const rows = [unread('alice', 3), unread('bob', 2)];
      const kept = keepLocalReadsCleared(rows, readLocally('alice'));
      expect(kept.map(c => c.getUnreadMessageCount())).toEqual([0, 2]);
    });

    it('leaves a chat nobody read on this device alone', () => {
      const rows = [unread('carol', 4)];
      expect(
        keepLocalReadsCleared(rows, () => false).map(c => c.getUnreadMessageCount())
      ).toEqual([4]);
    });

    it('matches on the conversation type too, not the id alone', () => {
      // A user chat and a group can share an id; only the one read is cleared.
      const rows = [unread('support', 5)];
      const groupOnly = (_id: string, type: string) => type === 'group';
      expect(
        keepLocalReadsCleared(rows, groupOnly).map(c => c.getUnreadMessageCount())
      ).toEqual([5]);
    });

    it('survives the receipt flush, which is what the sync page races', () => {
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('alice', 'user');
      expect(hub.wasReadLocally('alice', 'user')).toBe(true);
      // The message phase completes and the kit sends the receipt; the mark stays.
      (hub as any).flushReadsMadeOffline();
      expect(hub.wasReadLocally('alice', 'user')).toBe(true);
    });

    it('stops speaking for the chat once a new message makes it unread', () => {
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('alice', 'user');
      hub.forgetLocalRead('alice', 'user');
      expect(hub.wasReadLocally('alice', 'user')).toBe(false);
    });

    it('is forgotten when the session ends', () => {
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('alice', 'user');
      hub.endSession();
      expect(hub.wasReadLocally('alice', 'user')).toBe(false);
    });
  });
});
