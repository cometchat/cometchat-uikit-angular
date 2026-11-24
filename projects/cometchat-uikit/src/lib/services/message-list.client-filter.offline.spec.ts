/**
 * The default request on the offline path (JS SDK `writeThroughPlan`): a fetched
 * page reaches the SDK's cache only when `hideReplies` is its sole content filter,
 * so a top-level list with no consumer builder sends just that and filters on the
 * client. Offline-off requests, thread lists and consumer builders are untouched.
 */
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
  buildMessagesRequestImpl,
  buildNextMessagesRequestImpl,
  defaultListFilter,
  getDefaultMessageCategoriesImpl,
  getDefaultMessageTypesImpl,
  isClientFiltered,
} from './message-list.request-builder';
import { fetchNextOffline, fetchPreviousOffline } from './message-list.offline';
import { fetchPreviousMessagesImpl } from './message-list.fetch-utils';

function msg(text: string, state: Parameters<typeof offlineMessage>[1] = {}) {
  return offlineMessage(textMessage(text), state);
}

/** A sent row of another type, as the kit's default request would have filtered out. */
function hidden(id: number): CometChat.BaseMessage {
  const message = msg(`hidden ${id}`, { id, sentAt: id });
  (message as any).setType('location_custom');
  (message as any).setCategory('custom');
  return message;
}

const listHost = (over: Record<string, unknown> = {}) => ({
  DEFAULT_MESSAGE_LIMIT: 30,
  parentMessageId: null,
  isAgentChatMode: false,
  messagesRequestBuilder: null,
  replacedMessageTypes: null,
  replacedMessageCategories: null,
  customMessageTypes: new Set<string>(),
  customMessageCategories: new Set<string>(),
  hideGroupActionMessages: false,
  currentUser: { getUid: () => 'sam' },
  currentGroup: null,
  ...over,
});

/** Each fetch runs the next script with the listener; the SDK's Promise rejects offline, as the SDK's does. */
function scriptedRequest(scripts: ((listener: any) => void)[]) {
  return {
    reads: 0,
    fetchPrevious(listener: any) {
      this.reads++;
      scripts.shift()?.(listener);
      return Promise.reject({ code: 'FAILED_TO_FETCH' });
    },
    fetchNext(listener: any) {
      return this.fetchPrevious(listener);
    },
  } as any;
}

function listCtx(host: Record<string, unknown>, request: any): any {
  const ctx: any = {
    ...host,
    messagesRequest: request,
    nextMessagesRequest: request,
    fetchGeneration: 0,
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
    normalizeMessageId: (id: string | number) => Number(id),
    markInitialMessagesAsRead: vi.fn(() => Promise.resolve()),
    buildMessagesRequest: vi.fn(() => request),
    buildNextMessagesRequest: vi.fn(() => request),
    clearMessagesAndState: vi.fn(),
    isMessageForCurrentConversation: () => true,
  };
  return ctx;
}

/** A request the builder marked client-filtered, whose reads run the scripts. */
function filteredRequest(host: Record<string, unknown>, scripts: ((listener: any) => void)[]): any {
  return Object.assign(buildMessagesRequestImpl(host), scriptedRequest(scripts));
}

const ids = (ctx: any) => ctx.allMessagesSignal().map((m: CometChat.BaseMessage) => serverIdOf(m));

describe('default request (offline path)', () => {
  let fake: OfflineSdkFake;
  const realBuilder = (CometChat as any).MessagesRequestBuilder;
  /** Records every setter call on the request it builds. */
  class RecordingBuilder {
    calls: [string, unknown[]][] = [];
    constructor() {
      return new Proxy(this, {
        get: (target: any, prop: string) => {
          if (prop in target) return target[prop];
          return (...args: unknown[]) => {
            target.calls.push([prop, args]);
            return target.__proxy;
          };
        },
        set: (target: any, prop: string, value: unknown) => {
          target[prop] = value;
          return true;
        },
      });
    }
    build() {
      return { calls: (this as any).calls };
    }
  }
  const makeBuilderChainable = () => {
    Object.defineProperty(CometChat, 'MessagesRequestBuilder', {
      configurable: true,
      writable: true,
      value: function MessagesRequestBuilder() {
        const b: any = new RecordingBuilder();
        b.__proxy = b;
        return b;
      },
    });
  };
  const setters = (request: any) => request.calls.map(([name]: [string]) => name);
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    makeBuilderChainable();
  });
  afterEach(() => {
    Object.defineProperty(CometChat, 'MessagesRequestBuilder', {
      configurable: true,
      writable: true,
      value: realBuilder,
    });
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a top-level list sends only hideReplies, in both directions', () => {
    for (const build of [buildMessagesRequestImpl, buildNextMessagesRequestImpl]) {
      const request: any = build(listHost(), 7);
      expect(isClientFiltered(request)).toBe(true);
      expect(setters(request)).toEqual(['setLimit', 'hideReplies', 'setUID', 'setMessageId']);
      expect(request.calls.find(([name]: [string]) => name === 'hideReplies')[1]).toEqual([true]);
    }
  });

  it("offline off builds exactly today's request", () => {
    fake.setEnabled(false);
    for (const build of [buildMessagesRequestImpl, buildNextMessagesRequestImpl]) {
      const off: any = build(listHost());
      expect(setters(off)).toEqual([
        'setLimit',
        'setTypes',
        'setCategories',
        'hideReplies',
        'setUID',
      ]);
      expect(off.calls[1][1][0]).toEqual(getDefaultMessageTypesImpl(listHost()));
      expect(off.calls[2][1][0]).toEqual(getDefaultMessageCategoriesImpl(listHost()));
      expect(isClientFiltered(off)).toBe(false);
    }
  });

  it("a thread list keeps today's filters and is not filtered on the client", () => {
    const thread: any = buildMessagesRequestImpl(listHost({ parentMessageId: 5 }));
    expect(setters(thread)).toEqual([
      'setLimit',
      'setTypes',
      'setCategories',
      'hideReplies',
      'setUID',
      'setParentMessageId',
    ]);
    expect(isClientFiltered(thread)).toBe(false);
  });

  it('a consumer builder is used as given and never filtered on the client', () => {
    const consumerBuilder: any = new (CometChat as any).MessagesRequestBuilder();
    consumerBuilder.setTypes(['text']);
    const consumer: any = buildMessagesRequestImpl(
      listHost({ messagesRequestBuilder: consumerBuilder })
    );
    expect(setters(consumer)).not.toContain('setCategories');
    expect(isClientFiltered(consumer)).toBe(false);
  });

  it("the client filter is the server's: both the type and the category must match; unsent rows always show", () => {
    const shows = defaultListFilter(listHost());
    expect(shows(msg('text', { id: 1 }))).toBe(true);
    expect(shows(hidden(2))).toBe(false);
    const unsent = hidden(0);
    expect(shows(unsent)).toBe(true);
    const customType = hidden(3);
    expect(
      defaultListFilter(listHost({ customMessageTypes: new Set(['location_custom']) }))(customType)
    ).toBe(true);
    const action = msg('action', { id: 4 });
    (action as any).setCategory('action');
    (action as any).setType('groupMember');
    expect(shows(action)).toBe(true);
    expect(defaultListFilter(listHost({ hideGroupActionMessages: true }))(action)).toBe(false);
  });
});

describe('client-filtered pages (offline path)', () => {
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

  it('filters both the cached and the server page before they render', async () => {
    const host = listHost();
    let afterCached: number[] = [];
    const request = filteredRequest(host, [
      l => {
        l.onCachedMessages([msg('a', { id: 1, sentAt: 1 }), hidden(2)]);
        afterCached = ids(ctx);
        l.onServerMessages([
          msg('a', { id: 1, sentAt: 1 }),
          hidden(2),
          msg('c', { id: 3, sentAt: 3 }),
        ]);
      },
    ]);
    const ctx = listCtx(host, request);
    expect(await fetchPreviousOffline(ctx)).toBe(true);
    expect(afterCached).toEqual([1]);
    expect(ids(ctx)).toEqual([1, 3]);
  });

  it('a server page with only hidden rows keeps paging, with the loader on and no empty state between reads', async () => {
    const host = listHost();
    const loadingBetween: boolean[] = [];
    const request = filteredRequest(host, [
      l => l.onServerMessages([hidden(8), hidden(9)]),
      l => {
        loadingBetween.push(ctx.loadingStateSignal());
        l.onServerMessages([hidden(6), msg('shown', { id: 5, sentAt: 5 })]);
      },
    ]);
    const ctx = listCtx(host, request);
    expect(await fetchPreviousOffline(ctx)).toBe(true);
    expect(request.reads).toBe(2);
    expect(loadingBetween).toEqual([true]);
    expect(ids(ctx)).toEqual([5]);
    expect(ctx.loadingStateSignal()).toBe(false);
  });

  it('only an empty raw page ends the list, whatever was filtered before it', async () => {
    const host = listHost();
    const request = filteredRequest(host, [
      l => l.onServerMessages([hidden(8)]),
      l => l.onServerMessages([]),
    ]);
    const ctx = listCtx(host, request);
    expect(await fetchPreviousOffline(ctx)).toBe(false);
    expect(request.reads).toBe(2);
    expect(ctx.allMessagesSignal()).toEqual([]);
    expect(ctx.offlineFooterSignal()).toBe('none');
    expect(ctx.loadingStateSignal()).toBe(false);
  });

  it('a fetch of newer messages behaves the same', async () => {
    const host = listHost();
    const request = Object.assign(
      buildNextMessagesRequestImpl(host, 1),
      scriptedRequest([
        l => l.onServerMessages([hidden(2)]),
        l => l.onServerMessages([msg('n', { id: 3, sentAt: 3 })]),
      ])
    );
    const ctx = listCtx(host, request);
    expect(await fetchNextOffline(ctx)).toBe(true);
    expect(ids(ctx)).toEqual([3]);
  });

  it('offline: a cached page with only hidden rows reads the next cached page, then shows the footer', async () => {
    const host = listHost();
    const offline = { code: 'ERROR_INTERNET_UNAVAILABLE' };
    const request = filteredRequest(host, [
      l => {
        l.onCachedMessages([hidden(8)]);
        l.onError(offline);
      },
      l => {
        l.onCachedMessages([msg('saved', { id: 5, sentAt: 5 })]);
        l.onError(offline);
      },
    ]);
    const ctx = listCtx(host, request);
    expect(await fetchPreviousOffline(ctx)).toBe(false);
    expect(request.reads).toBe(2);
    expect(ids(ctx)).toEqual([5]);
    expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
  });

  it('offline: an empty cached page ends the read with the error view (D83) and never an empty loop', async () => {
    const host = listHost();
    const request = filteredRequest(host, [
      l => {
        l.onCachedMessages([]);
        l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      },
    ]);
    const ctx = listCtx(host, request);
    expect(await fetchPreviousOffline(ctx)).toBe(true);
    expect(request.reads).toBe(1);
    // Nothing on screen: the error view, not the footer (D83).
    expect(ctx.offlineFooterSignal()).toBe('none');
    expect(ctx.errorStateSignal()).toEqual({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    expect(ctx.loadingStateSignal()).toBe(false);
  });

  it('delete by omission compares against the raw page: a filtered row keeps the range, a deleted row inside it goes', async () => {
    const host = listHost();
    const request = filteredRequest(host, [
      l => {
        l.onCachedMessages([
          msg('older', { id: 1, sentAt: 1 }),
          msg('deleted on the server', { id: 3, sentAt: 3 }),
          msg('c', { id: 5, sentAt: 5 }),
        ]);
        // The raw page spans 2..6 through hidden rows; the shown row alone spans only 5.
        l.onServerMessages([hidden(2), msg('c', { id: 5, sentAt: 5 }), hidden(6)]);
      },
    ]);
    const ctx = listCtx(host, request);
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 5]);
  });

  it("a cached row outside the raw page's range stays (not a proven omission)", async () => {
    const host = listHost();
    const request = filteredRequest(host, [
      l => {
        l.onCachedMessages([msg('older', { id: 1, sentAt: 1 }), msg('c', { id: 5, sentAt: 5 })]);
        l.onServerMessages([hidden(4), msg('c', { id: 5, sentAt: 5 })]);
      },
    ]);
    const ctx = listCtx(host, request);
    await fetchPreviousOffline(ctx);
    expect(ids(ctx)).toEqual([1, 5]);
  });

  it("kill switch: the next read on today's path uses a request the server filters", async () => {
    const host = listHost();
    const stale = buildMessagesRequestImpl(host);
    const plainFetch = vi.fn(() => Promise.resolve([]));
    const ctx = listCtx(host, stale);
    ctx.prevMessageIdSignal.set(40);
    ctx.buildMessagesRequest = vi.fn(() => ({ fetchPrevious: plainFetch }));
    fake.setEnabled(false);
    await fetchPreviousMessagesImpl(ctx);
    expect(ctx.buildMessagesRequest).toHaveBeenCalledWith(40);
    expect(plainFetch).toHaveBeenCalledTimes(1);
  });
});
