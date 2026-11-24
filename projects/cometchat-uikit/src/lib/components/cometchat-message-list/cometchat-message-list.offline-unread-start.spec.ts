/**
 * UIT-READ-09: "start from first unread" with offline support on lands on the
 * first unread message, not at the bottom and not wherever an older page left it.
 *
 * With offline on the chat opens on its newest page (it paints from the
 * device), and only then is the list positioned on the unread divider, by a
 * jump when the unread run starts before that page. The window is therefore
 * painted before it is positioned. Until it is, neither scroll observer may page
 * (the top sentinel is in view on the unpositioned newest page, so the top
 * observer would load an older page from there and move the rows under the
 * reader), and nothing may scroll to the bottom. The same defect landed the
 * React kit at the bottom (uikit-react 6dec2dc54).
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
import {
  handleUserChangeImpl,
  RESUME_PAGING_AFTER_MS,
} from './cometchat-message-list.conversation-handlers';

const SAM = new CometChat.User('sam');

function message(id: number) {
  const m = offlineMessage(textMessage(`message ${id}`, 'alex'), { id, sentAt: id });
  m.setSender(SAM);
  return m;
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => message(from + i));

interface Paint {
  phase: string;
  hasMorePrevious: boolean;
  hasMoreNext: boolean;
}

/** The component's side of the flow, as the handlers see it. */
function componentStub(service: any) {
  const ctx: any = {
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
    goToMessageId: undefined,
    startFromUnreadMessages: true,
    loggedInUser: new CometChat.User('alex'),
    cdr: { markForCheck: vi.fn() },
    messages: () => service.messages(),
    scrollToMessageWithRetry: vi.fn(),
    scrollToBottomAfterLoad: vi.fn(),
    publishActiveChatChanged: vi.fn(),
    getConversationId: () => 'alex_user_sam',
    conversationsService: undefined,
    notifyMessagesRead: vi.fn(),
  };
  return ctx;
}

describe('start from first unread, offline on (UIT-READ-09)', () => {
  let fake: OfflineSdkFake;
  let service: any;
  let ctx: any;
  let paints: Paint[];

  /** A page read: `cached` then `server` are handed to the listener, each logged with the flags the observers read. */
  function page(label: string, cached: any[] | null, server: any[]) {
    const run = (listener?: any) => {
      if (listener) {
        if (cached) {
          paints.push({
            phase: `${label} cached`,
            hasMorePrevious: ctx.hasMorePrevious(),
            hasMoreNext: ctx.hasMoreNext(),
          });
          listener.onCachedMessages?.(cached);
        }
        paints.push({
          phase: `${label} server`,
          hasMorePrevious: ctx.hasMorePrevious(),
          hasMoreNext: ctx.hasMoreNext(),
        });
        listener.onServerMessages?.(server);
      }
      return Promise.resolve(server);
    };
    return { fetchPrevious: vi.fn(run), fetchNext: vi.fn(run) };
  }

  /** 80 messages, 40 unread (lastRead 40), pages of 30. */
  function arrange(conversation: { unread: number; lastRead: number }, newestPage = range(51, 80)) {
    const newest = page('newest', newestPage, newestPage);
    const olderThanNewest = page('older', null, range(21, 50));
    const aroundBefore = page('around-before', null, range(11, 40));
    const aroundAfter = page('around-after', null, range(41, 70));
    service.buildMessagesRequest = vi.fn((id?: number) => (id ? aroundBefore : newest));
    service.buildNextMessagesRequest = vi.fn((id?: number) =>
      id === 40 ? aroundAfter : olderThanNewest
    );
    const conv = {
      getLastReadMessageId: () => conversation.lastRead,
      getUnreadMessageCount: () => conversation.unread,
    };
    (CometChat as any).getConversation = vi.fn((_id: string, _type: string, listener?: any) => {
      if (listener) listener.onServerConversation?.(conv);
      return Promise.resolve(conv);
    });
    // Online, the last-read message itself is found: the jump to its window goes ahead
    // (a target that cannot be read leaves the newest page, ENG-57322).
    if (conversation.lastRead > 0) fake.singleReads.push(l => l.onServerMessage(message(conversation.lastRead)));
    return { newest, olderThanNewest };
  }

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
    paints = [];
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  /** Run the flow to its end (reads settle; timers advance only as far as asked). */
  async function open(): Promise<void> {
    handleUserChangeImpl(ctx, SAM);
    await vi.advanceTimersByTimeAsync(50);
  }

  it('the unread run starts before the newest page: the window is painted unpositioned, so no observer may page, then it jumps to the first unread', async () => {
    arrange({ unread: 40, lastRead: 40 });
    await open();
    // Every paint (newest page, then the window around the last-read message) happened with paging off.
    expect(paints.length).toBeGreaterThanOrEqual(4);
    for (const paint of paints)
      expect(paint, paint.phase).toMatchObject({ hasMorePrevious: false, hasMoreNext: false });
    // It ended on the first unread message (41), never at the bottom.
    expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledTimes(1);
    expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(41, 10);
    expect(ctx.scrollToBottomAfterLoad).not.toHaveBeenCalled();
    expect(ctx.unreadDividerMessageId()).toBe(41);
    expect(service.messages().map((m: any) => m.getId())).toContain(41);
  });

  it('the unread run starts inside the newest page: positioned on its first unread message, paging off until then and resumed after', async () => {
    arrange({ unread: 10, lastRead: 70 });
    await open();
    for (const paint of paints)
      expect(paint, paint.phase).toMatchObject({ hasMorePrevious: false, hasMoreNext: false });
    expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(71, 10);
    expect(ctx.scrollToBottomAfterLoad).not.toHaveBeenCalled();
    expect(ctx.unreadDividerMessageId()).toBe(71);
    // The scroll itself resumes paging once it finds the row; if it never does, older messages stay reachable.
    expect(ctx.hasMorePrevious()).toBe(false);
    await vi.advanceTimersByTimeAsync(RESUME_PAGING_AFTER_MS);
    expect(ctx.hasMorePrevious()).toBe(true);
  });

  it('nothing unread: the newest page, scrolled to the bottom, with older messages reachable', async () => {
    arrange({ unread: 0, lastRead: 80 });
    await open();
    expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalledTimes(1);
    expect(ctx.hasMorePrevious()).toBe(true);
    expect(ctx.hasMoreNext()).toBe(false);
  });

  it('a conversation the SDK has no record of: the same, never stuck with paging off', async () => {
    arrange({ unread: 0, lastRead: 0 });
    (CometChat as any).getConversation = vi.fn(() =>
      Promise.reject({ code: 'ERR_CONVERSATION_NOT_FOUND' })
    );
    await open();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalledTimes(1);
    expect(ctx.hasMorePrevious()).toBe(true);
  });

  it('switching chats mid-read leaves the new chat in charge of the flags', async () => {
    arrange({ unread: 40, lastRead: 40 });
    handleUserChangeImpl(ctx, SAM);
    service.setUser(new CometChat.User('bea'));
    ctx.hasMorePrevious.set(true);
    await vi.advanceTimersByTimeAsync(50);
    expect(ctx.hasMorePrevious()).toBe(true);
    expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
  });
});
