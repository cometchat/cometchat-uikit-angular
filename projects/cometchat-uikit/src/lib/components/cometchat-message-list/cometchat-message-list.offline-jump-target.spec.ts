/**
 * Offline ON: a chat opened with "start from unread" (last-read older than the
 * newest page) or at a message id (push, deep link) jumps to that message from
 * the cache. When the message is neither cached nor reachable, the chat stays
 * on the newest cached page: no error, no divider, no scroll target
 * (Aditya, 2026-11-04). The jump never re-reads the conversation with the
 * server-only `CometChat.getConversation`.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { MessageListService } from '../../services/message-list.service';
import { handleUserChangeImpl } from './cometchat-message-list.conversation-handlers';

const SAM = new CometChat.User('sam');
const NOT_CONNECTED = { code: 'FAILED_TO_FETCH' };

function message(id: number) {
  const m = offlineMessage(textMessage(`message ${id}`, 'alex'), { id, sentAt: id });
  m.setSender(SAM);
  return m;
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => message(from + i));

function componentStub(service: any) {
  return {
    footerPanelConfig: signal(null),
    showFooterPanel: signal(false),
    pendingReadReceipts: new Map(),
    showScrollToBottom: signal(false),
    showNewMessagesBanner: signal(false),
    newMessagesCount: signal(0),
    hasMorePrevious: signal(true),
    hasMoreNext: signal(false),
    unreadDividerMessageId: signal<number | null>(null),
    markedAsUnreadCount: signal(0),
    lastUnreadMarkedMessageId: signal<number | null>(null),
    messageListService: service,
    user: undefined,
    group: undefined,
    parentMessageId: null,
    goToMessageId: undefined as number | undefined,
    startFromUnreadMessages: false,
    loggedInUser: new CometChat.User('alex'),
    cdr: { markForCheck: vi.fn() },
    messages: () => service.messages(),
    scrollToMessageWithRetry: vi.fn(),
    scrollToBottomAfterLoad: vi.fn(),
    publishActiveChatChanged: vi.fn(),
    getConversationId: () => 'alex_user_sam',
    conversationsService: undefined,
    notifyMessagesRead: vi.fn(),
  } as any;
}

describe('offline ON: jump to a target message that may not be cached', () => {
  let fake: OfflineSdkFake;
  let service: any;
  let ctx: any;
  let conversationReads: { withListener: number; serverOnly: number };
  let aroundReads: number;

  /** A page: `cached` (if any) then `server` go to the listener; an offline read past the cache errors. */
  function page(cached: any[] | null, server: any[] | 'offline', onRead?: () => void) {
    const run = (listener?: any) => {
      onRead?.();
      if (server === 'offline') {
        listener?.onError?.(NOT_CONNECTED);
        return Promise.reject(NOT_CONNECTED);
      }
      if (listener) {
        if (cached) listener.onCachedMessages?.(cached);
        listener.onServerMessages?.(server);
      }
      return Promise.resolve(server);
    };
    return { fetchPrevious: vi.fn(run), fetchNext: vi.fn(run) };
  }

  /** 80 messages, the newest page 51-80 is what the device holds around the tail. */
  function arrange(opts: { targetCached: boolean; unread?: { unread: number; lastRead: number } }) {
    const newest = page(range(51, 80), range(51, 80));
    const around = opts.targetCached
      ? {
          before: page(range(11, 40), range(11, 40), () => aroundReads++),
          after: page(range(41, 70), range(41, 70), () => aroundReads++),
        }
      : {
          before: page(null, 'offline', () => aroundReads++),
          after: page(null, 'offline', () => aroundReads++),
        };
    service.buildMessagesRequest = vi.fn((id?: number) => (id ? around.before : newest));
    service.buildNextMessagesRequest = vi.fn((id?: number) =>
      id && id < 51 ? around.after : page(null, [])
    );
    fake.connected = opts.targetCached;
    // The target by id: its device copy when cached; offline and never cached, the SDK rejects.
    fake.singleReads.push(listener => {
      if (opts.targetCached) listener.onCachedMessage?.(message(40));
    });
    conversationReads = { withListener: 0, serverOnly: 0 };
    const conv = {
      getLastReadMessageId: () => opts.unread?.lastRead ?? 0,
      getUnreadMessageCount: () => opts.unread?.unread ?? 0,
    };
    (CometChat as any).getConversation = vi.fn((_id: string, _type: string, listener?: any) => {
      if (listener) {
        conversationReads.withListener++;
        listener.onServerConversation?.(conv);
        return Promise.resolve(conv);
      }
      // The server-only read: it cannot be answered offline.
      conversationReads.serverOnly++;
      return Promise.reject(NOT_CONNECTED);
    });
  }

  async function open(): Promise<void> {
    handleUserChangeImpl(ctx, SAM);
    await vi.advanceTimersByTimeAsync(50);
  }

  const ids = () => service.messages().map((m: any) => m.getId());

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    OfflineHub.getInstance().start();
    TestBed.configureTestingModule({ providers: [MessageListService] });
    service = TestBed.inject(MessageListService);
    ctx = componentStub(service);
    aroundReads = 0;
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  describe('start from unread, the last-read message older than the newest page', () => {
    beforeEach(() => {
      ctx.startFromUnreadMessages = true;
    });

    it('cached: jumps to the first unread from the cache, on the conversation already read, with no server getConversation', async () => {
      arrange({ targetCached: true, unread: { unread: 40, lastRead: 40 } });
      await open();
      expect(conversationReads).toEqual({ withListener: 1, serverOnly: 0 });
      expect(ctx.unreadDividerMessageId()).toBe(41);
      expect(ctx.markedAsUnreadCount()).toBe(40);
      expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(41, 10);
      expect(ctx.scrollToBottomAfterLoad).not.toHaveBeenCalled();
      expect(ids()).toContain(41);
      expect(service.errorState()).toBeNull();
    });

    it('not cached and offline: stays on the newest cached page, no error, no divider, no scroll target', async () => {
      arrange({ targetCached: false, unread: { unread: 40, lastRead: 40 } });
      await open();
      expect(conversationReads.serverOnly).toBe(0);
      expect(ids()).toEqual(range(51, 80).map(m => m.getId()));
      expect(service.errorState()).toBeNull();
      expect(ctx.unreadDividerMessageId()).toBeNull();
      expect(ctx.markedAsUnreadCount()).toBe(0);
      expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
      expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalledTimes(1);
      expect(ctx.hasMorePrevious()).toBe(true);
      expect(aroundReads).toBe(0);
    });
  });

  describe('goToMessageId', () => {
    beforeEach(() => {
      ctx.goToMessageId = 40;
    });

    it('cached: the window around it is read from the cache and the list scrolls to it, no server getConversation', async () => {
      arrange({ targetCached: true });
      await open();
      expect(conversationReads.serverOnly).toBe(0);
      expect(ids()).toContain(40);
      expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(40, 10);
      expect(ctx.scrollToBottomAfterLoad).not.toHaveBeenCalled();
      expect(service.errorState()).toBeNull();
    });

    it('not cached and offline: the newest cached page, no error, no scroll target, not an empty list', async () => {
      arrange({ targetCached: false });
      await open();
      expect(ids()).toEqual(range(51, 80).map(m => m.getId()));
      expect(service.errorState()).toBeNull();
      expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
      expect(ctx.unreadDividerMessageId()).toBeNull();
      expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalledTimes(1);
      expect(ctx.hasMorePrevious()).toBe(true);
      expect(ctx.hasMoreNext()).toBe(false);
      expect(aroundReads).toBe(0);
    });
  });
});
