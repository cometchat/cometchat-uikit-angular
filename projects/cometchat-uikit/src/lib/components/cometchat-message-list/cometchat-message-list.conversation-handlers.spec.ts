/**
 * cometchat-message-list.conversation-handlers Tests
 *
 * Covers: handleConversationChangeImpl, handleParentMessageIdChangeImpl,
 *         subscribeToChatStateServiceImpl, scheduleDeferredConversationChangeImpl,
 *         handleUserChangeImpl, handleGroupChangeImpl,
 *         scrollToFirstUnreadOrBottomImpl, and the unread-pivot path they delegate to.
 *
 * @module components/cometchat-message-list/conversation-handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';

// takeUntilDestroyed() needs an injection context; these handlers are plain functions,
// so the operator is replaced with a pass-through for the subscription tests.
vi.mock('@angular/core/rxjs-interop', () => ({
  takeUntilDestroyed: () => <T>(source: T) => source,
}));

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../../Enums/Enums';
import {
  handleConversationChangeImpl,
  handleParentMessageIdChangeImpl,
  subscribeToChatStateServiceImpl,
  scheduleDeferredConversationChangeImpl,
  handleUserChangeImpl,
  handleGroupChangeImpl,
  scrollToFirstUnreadOrBottomImpl,
} from './cometchat-message-list.conversation-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal writable-signal stand-in: callable for reads, with a spied `set`. */
function sig<T>(initial: T) {
  const box = { value: initial };
  const fn = (() => box.value) as unknown as {
    (): T;
    set: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  fn.set = vi.fn((v: T) => {
    box.value = v;
  });
  fn.update = vi.fn((f: (v: T) => T) => {
    box.value = f(box.value);
  });
  return fn;
}

function makeUser(uid = 'alice') {
  return { getUid: () => uid } as unknown as CometChat.User;
}

function makeGroup(guid = 'group-1') {
  return { getGuid: () => guid } as unknown as CometChat.Group;
}

function makeMessage(id: number, senderUid = 'bob', readAt?: number) {
  return {
    getId: () => id,
    getSender: () => ({ getUid: () => senderUid }),
    getReadAt: () => readAt,
  } as unknown as CometChat.BaseMessage;
}

function makeCtx(overrides: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = {
    footerPanelConfig: sig<unknown>(null),
    showFooterPanel: sig(false),
    pendingReadReceipts: new Map<string, unknown>(),
    showScrollToBottom: sig(false),
    showNewMessagesBanner: sig(false),
    newMessagesCount: sig(0),
    hasMorePrevious: sig(true),
    hasMoreNext: sig(false),
    unreadDividerMessageId: sig<number | null>(null),
    markedAsUnreadCount: sig(0),
    lastUnreadMarkedMessageId: sig<number | null>(null),
    listState: sig(States.loaded),
    messages: sig<CometChat.BaseMessage[]>([]),

    isFirstLoad: false,
    user: undefined,
    group: undefined,
    isAgentChat: false,
    loadLastAgentConversation: false,
    parentMessageId: null,
    goToMessageId: null,
    startFromUnreadMessages: false,
    loggedInUser: makeUser('me'),
    conversationChangeScheduled: false,
    pendingUser: null,
    pendingGroup: null,
    destroyRef: {},

    messageListService: {
      clearError: vi.fn(),
      setUser: vi.fn(),
      setGroup: vi.fn(),
      setParentMessageId: vi.fn(),
      setLoadingState: vi.fn(),
      clearMessages: vi.fn(),
      clearConversation: vi.fn(),
      fetchPreviousMessages: vi.fn().mockResolvedValue(undefined),
      fetchMessagesAroundId: vi.fn().mockResolvedValue(undefined),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      getFetchGeneration: vi.fn().mockReturnValue(1),
    },
    chatStateService: {
      activeUser$: new Subject<CometChat.User | null>(),
      activeGroup$: new Subject<CometChat.Group | null>(),
    },
    conversationsService: { updateConversationUnreadCount: vi.fn() },

    cdr: { markForCheck: vi.fn() },
    scrollToMessageWithRetry: vi.fn(),
    scrollToBottomAfterLoad: vi.fn(),
    publishActiveChatChanged: vi.fn(),
    getConversationId: vi.fn().mockReturnValue('conv-1'),
    notifyMessagesRead: vi.fn(),
    isReceiverMessage: (msg: CometChat.BaseMessage) => msg.getSender()?.getUid() !== 'me',
  };
  return Object.assign(ctx, overrides) as any;
}

/** Lets queued microtasks and resolved promise callbacks run. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// handleConversationChangeImpl
// ---------------------------------------------------------------------------

describe('handleConversationChangeImpl', () => {
  it('resets the per-conversation UI state before loading', () => {
    const ctx = makeCtx({ user: makeUser() });
    handleConversationChangeImpl(ctx);

    expect(ctx.footerPanelConfig.set).toHaveBeenCalledWith(null);
    expect(ctx.showFooterPanel.set).toHaveBeenCalledWith(false);
    expect(ctx.showScrollToBottom.set).toHaveBeenCalledWith(false);
    expect(ctx.showNewMessagesBanner.set).toHaveBeenCalledWith(false);
    expect(ctx.newMessagesCount.set).toHaveBeenCalledWith(0);
    expect(ctx.hasMorePrevious.set).toHaveBeenCalledWith(true);
    expect(ctx.hasMoreNext.set).toHaveBeenCalledWith(false);
    expect(ctx.isFirstLoad).toBe(true);
  });

  it('clears pending read receipts so none leak into the next conversation', () => {
    const pendingReadReceipts = new Map([['m1', {}]]);
    const ctx = makeCtx({ user: makeUser(), pendingReadReceipts });
    handleConversationChangeImpl(ctx);
    expect(pendingReadReceipts.size).toBe(0);
  });

  it('clears stale error state before switching', () => {
    const ctx = makeCtx({ user: makeUser() });
    handleConversationChangeImpl(ctx);
    expect(ctx.messageListService.clearError).toHaveBeenCalled();
  });

  it('sets the user and fetches previous messages', async () => {
    const user = makeUser();
    const ctx = makeCtx({ user });
    handleConversationChangeImpl(ctx);

    expect(ctx.messageListService.setUser).toHaveBeenCalledWith(user);
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    await flush();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
    expect(ctx.publishActiveChatChanged).toHaveBeenCalled();
  });

  it('sets the group and fetches previous messages when no user is set', async () => {
    const group = makeGroup();
    const ctx = makeCtx({ group });
    handleConversationChangeImpl(ctx);

    expect(ctx.messageListService.setGroup).toHaveBeenCalledWith(group);
    await flush();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });

  it('clears the conversation when neither user nor group is set', () => {
    const ctx = makeCtx();
    handleConversationChangeImpl(ctx);
    expect(ctx.messageListService.clearConversation).toHaveBeenCalled();
    expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
  });

  describe('agent chat without a parent message', () => {
    it('shows the shimmer while history loads in the background', () => {
      const ctx = makeCtx({ user: makeUser(), isAgentChat: true, loadLastAgentConversation: true });
      handleConversationChangeImpl(ctx);

      expect(ctx.messageListService.setLoadingState).toHaveBeenCalledWith(false);
      expect(ctx.listState.set).toHaveBeenCalledWith(States.loading);
      expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
    });

    it('shows the empty state when there is no history to wait for', () => {
      const ctx = makeCtx({ user: makeUser(), isAgentChat: true, loadLastAgentConversation: false });
      handleConversationChangeImpl(ctx);
      expect(ctx.listState.set).toHaveBeenCalledWith(States.empty);
    });

    it('applies the same rule to groups', () => {
      const ctx = makeCtx({ group: makeGroup(), isAgentChat: true, loadLastAgentConversation: true });
      handleConversationChangeImpl(ctx);
      expect(ctx.listState.set).toHaveBeenCalledWith(States.loading);
      expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
    });
  });

  describe('goToMessageId', () => {
    it('fetches around a numeric id and disables both pagination directions', async () => {
      const ctx = makeCtx({ user: makeUser(), goToMessageId: 42 });
      handleConversationChangeImpl(ctx);

      expect(ctx.hasMorePrevious.set).toHaveBeenCalledWith(false);
      expect(ctx.hasMoreNext.set).toHaveBeenCalledWith(false);
      expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(42);
      await flush();
      expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(42, 10);
      expect(ctx.publishActiveChatChanged).toHaveBeenCalled();
    });

    it('parses a string id', () => {
      const ctx = makeCtx({ user: makeUser(), goToMessageId: '77' });
      handleConversationChangeImpl(ctx);
      expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(77);
    });

    it('falls back to a normal fetch when the id is not a number', () => {
      const ctx = makeCtx({ user: makeUser(), goToMessageId: 'not-a-number' });
      handleConversationChangeImpl(ctx);

      expect(ctx.messageListService.fetchMessagesAroundId).not.toHaveBeenCalled();
      expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    });

    it('swallows a fetch rejection without throwing', async () => {
      const ctx = makeCtx({ user: makeUser(), goToMessageId: 42 });
      ctx.messageListService.fetchMessagesAroundId.mockRejectedValue(new Error('network'));
      expect(() => handleConversationChangeImpl(ctx)).not.toThrow();
      await flush();
      expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
    });

    it('works on the group branch too', async () => {
      const ctx = makeCtx({ group: makeGroup(), goToMessageId: 9 });
      handleConversationChangeImpl(ctx);
      expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(9);
      await flush();
      expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(9, 10);
    });
  });
});

// ---------------------------------------------------------------------------
// handleParentMessageIdChangeImpl
// ---------------------------------------------------------------------------

describe('handleParentMessageIdChangeImpl', () => {
  it('sets the parent id, clears messages and refetches', async () => {
    const ctx = makeCtx({ parentMessageId: 5 });
    handleParentMessageIdChangeImpl(ctx);

    expect(ctx.messageListService.setParentMessageId).toHaveBeenCalledWith(5);
    expect(ctx.messageListService.clearMessages).toHaveBeenCalled();
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    await flush();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });

  it('re-applies the user on an agent chat', () => {
    const user = makeUser();
    const ctx = makeCtx({ parentMessageId: 5, isAgentChat: true, user });
    handleParentMessageIdChangeImpl(ctx);
    expect(ctx.messageListService.setUser).toHaveBeenCalledWith(user);
  });

  it('re-applies the group on an agent chat with no user', () => {
    const group = makeGroup();
    const ctx = makeCtx({ parentMessageId: 5, isAgentChat: true, group });
    handleParentMessageIdChangeImpl(ctx);
    expect(ctx.messageListService.setGroup).toHaveBeenCalledWith(group);
  });

  it('does not re-apply the conversation outside an agent chat', () => {
    const ctx = makeCtx({ parentMessageId: 5, user: makeUser() });
    handleParentMessageIdChangeImpl(ctx);
    expect(ctx.messageListService.setUser).not.toHaveBeenCalled();
  });

  it('resets an agent chat to empty when the parent id is cleared', () => {
    const ctx = makeCtx({ parentMessageId: null, isAgentChat: true });
    handleParentMessageIdChangeImpl(ctx);

    expect(ctx.messageListService.setParentMessageId).toHaveBeenCalledWith(null);
    expect(ctx.messageListService.clearMessages).toHaveBeenCalled();
    expect(ctx.messageListService.setLoadingState).toHaveBeenCalledWith(false);
    expect(ctx.listState.set).toHaveBeenCalledWith(States.empty);
  });

  it('does nothing when the parent id is cleared outside an agent chat', () => {
    const ctx = makeCtx({ parentMessageId: null, isAgentChat: false });
    handleParentMessageIdChangeImpl(ctx);
    expect(ctx.messageListService.setParentMessageId).not.toHaveBeenCalled();
    expect(ctx.messageListService.clearMessages).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribeToChatStateServiceImpl
// ---------------------------------------------------------------------------

describe('subscribeToChatStateServiceImpl', () => {
  it('stages an active user and clears any pending group', async () => {
    const ctx = makeCtx();
    const user = makeUser();
    subscribeToChatStateServiceImpl(ctx);

    ctx.chatStateService.activeUser$.next(user);
    expect(ctx.pendingGroup).toBeNull();
    await flush();
    expect(ctx.messageListService.setUser).toHaveBeenCalledWith(user);
  });

  it('stages an active group and clears any pending user', async () => {
    const ctx = makeCtx();
    const group = makeGroup();
    subscribeToChatStateServiceImpl(ctx);

    ctx.chatStateService.activeGroup$.next(group);
    expect(ctx.pendingUser).toBeNull();
    await flush();
    expect(ctx.messageListService.setGroup).toHaveBeenCalledWith(group);
  });

  it('ignores null emissions', async () => {
    const ctx = makeCtx();
    subscribeToChatStateServiceImpl(ctx);

    ctx.chatStateService.activeUser$.next(null);
    ctx.chatStateService.activeGroup$.next(null);
    await flush();
    expect(ctx.messageListService.setUser).not.toHaveBeenCalled();
    expect(ctx.messageListService.setGroup).not.toHaveBeenCalled();
  });

  it('applies only the latest conversation when both arrive in one tick', async () => {
    const ctx = makeCtx();
    const user = makeUser();
    const group = makeGroup();
    subscribeToChatStateServiceImpl(ctx);

    ctx.chatStateService.activeUser$.next(user);
    ctx.chatStateService.activeGroup$.next(group);
    await flush();

    expect(ctx.messageListService.setGroup).toHaveBeenCalledWith(group);
    expect(ctx.messageListService.setUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// scheduleDeferredConversationChangeImpl
// ---------------------------------------------------------------------------

describe('scheduleDeferredConversationChangeImpl', () => {
  it('coalesces repeated calls into a single deferred change', async () => {
    const ctx = makeCtx({ pendingUser: makeUser() });
    scheduleDeferredConversationChangeImpl(ctx);
    scheduleDeferredConversationChangeImpl(ctx);
    scheduleDeferredConversationChangeImpl(ctx);

    await flush();
    expect(ctx.messageListService.setUser).toHaveBeenCalledTimes(1);
  });

  it('clears the scheduled flag so a later change still runs', async () => {
    const ctx = makeCtx({ pendingUser: makeUser('one') });
    scheduleDeferredConversationChangeImpl(ctx);
    await flush();
    expect(ctx.conversationChangeScheduled).toBe(false);

    ctx.pendingUser = makeUser('two');
    scheduleDeferredConversationChangeImpl(ctx);
    await flush();
    expect(ctx.messageListService.setUser).toHaveBeenCalledTimes(2);
  });

  it('prefers a pending user over a pending group', async () => {
    const ctx = makeCtx({ pendingUser: makeUser(), pendingGroup: makeGroup() });
    scheduleDeferredConversationChangeImpl(ctx);
    await flush();

    expect(ctx.messageListService.setUser).toHaveBeenCalled();
    expect(ctx.messageListService.setGroup).not.toHaveBeenCalled();
  });

  it('does nothing when nothing is pending', async () => {
    const ctx = makeCtx();
    scheduleDeferredConversationChangeImpl(ctx);
    await flush();
    expect(ctx.messageListService.setUser).not.toHaveBeenCalled();
    expect(ctx.messageListService.setGroup).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleUserChangeImpl / handleGroupChangeImpl
// ---------------------------------------------------------------------------

describe('handleUserChangeImpl', () => {
  it('resets unread state and swaps user in for group', () => {
    const ctx = makeCtx({ group: makeGroup() });
    const user = makeUser();
    handleUserChangeImpl(ctx, user);

    expect(ctx.unreadDividerMessageId.set).toHaveBeenCalledWith(null);
    expect(ctx.markedAsUnreadCount.set).toHaveBeenCalledWith(0);
    expect(ctx.lastUnreadMarkedMessageId.set).toHaveBeenCalledWith(null);
    expect(ctx.messageListService.clearError).toHaveBeenCalled();
    expect(ctx.user).toBe(user);
    expect(ctx.group).toBeUndefined();
  });

  it('carries the parent message id over', () => {
    const ctx = makeCtx({ parentMessageId: 12 });
    handleUserChangeImpl(ctx, makeUser());
    expect(ctx.messageListService.setParentMessageId).toHaveBeenCalledWith(12);
  });

  it('fetches around goToMessageId instead of the latest page', async () => {
    const ctx = makeCtx({ goToMessageId: '31' });
    handleUserChangeImpl(ctx, makeUser());

    expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(31);
    expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
    await flush();
    expect(ctx.cdr.markForCheck).toHaveBeenCalled();
  });

  it('logs and recovers when the goToMessageId fetch rejects', async () => {
    const ctx = makeCtx({ goToMessageId: 31 });
    ctx.messageListService.fetchMessagesAroundId.mockRejectedValue(new Error('boom'));
    handleUserChangeImpl(ctx, makeUser());
    await flush();
    expect(ctx.scrollToMessageWithRetry).not.toHaveBeenCalled();
  });

  it('loads the latest page when there is no pivot', async () => {
    const ctx = makeCtx();
    handleUserChangeImpl(ctx, makeUser());
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    await flush();
    expect(ctx.publishActiveChatChanged).toHaveBeenCalled();
  });
});

describe('handleGroupChangeImpl', () => {
  it('swaps group in for user and resets unread state', () => {
    const ctx = makeCtx({ user: makeUser() });
    const group = makeGroup();
    handleGroupChangeImpl(ctx, group);

    expect(ctx.group).toBe(group);
    expect(ctx.user).toBeUndefined();
    expect(ctx.unreadDividerMessageId.set).toHaveBeenCalledWith(null);
    expect(ctx.messageListService.setGroup).toHaveBeenCalledWith(group);
  });

  it('fetches around goToMessageId when present', () => {
    const ctx = makeCtx({ goToMessageId: 8 });
    handleGroupChangeImpl(ctx, makeGroup());
    expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(8);
  });

  it('loads the latest page otherwise', async () => {
    const ctx = makeCtx();
    handleGroupChangeImpl(ctx, makeGroup());
    await flush();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// The unread pivot (reached via startFromUnreadMessages)
// ---------------------------------------------------------------------------

describe('unread pivot', () => {
  function conversation(unreadCount: number, lastReadMessageId: unknown) {
    return {
      getUnreadMessageCount: () => unreadCount,
      getLastReadMessageId: () => lastReadMessageId,
    } as unknown as CometChat.Conversation;
  }

  it('loads the latest page when there are no unread messages', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(0, '10'));
    const ctx = makeCtx({ startFromUnreadMessages: true });
    handleUserChangeImpl(ctx, makeUser());
    await flush();

    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });

  it('ignores a lastReadMessageId of "0"', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(3, '0'));
    const ctx = makeCtx({ startFromUnreadMessages: true });
    handleUserChangeImpl(ctx, makeUser());
    await flush();
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
  });

  it('fetches around the last read message and marks the divider', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 100));
    const messages = [makeMessage(100, 'me', 123), makeMessage(101), makeMessage(102)];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });

    handleUserChangeImpl(ctx, makeUser());
    await flush();
    await flush();

    expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(100);
    expect(ctx.unreadDividerMessageId.set).toHaveBeenCalledWith(101);
    expect(ctx.showScrollToBottom.set).toHaveBeenCalledWith(true);
    expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(101, 10);
  });

  it('marks the latest unread receiver message as read and zeroes the badge', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 100));
    const messages = [makeMessage(100, 'me', 123), makeMessage(101), makeMessage(102)];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });

    handleUserChangeImpl(ctx, makeUser());
    await flush();
    await flush();

    expect(ctx.messageListService.markAsRead).toHaveBeenCalledWith(messages[2]);
    expect(ctx.markedAsUnreadCount.set).toHaveBeenCalledWith(0);
    expect(ctx.conversationsService.updateConversationUnreadCount).toHaveBeenCalledWith('conv-1', 0);
    expect(ctx.notifyMessagesRead).toHaveBeenCalledWith(messages[2]);
  });

  it('falls back to the first unread receiver message when the pivot is not in the page', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 55));
    const messages = [makeMessage(70), makeMessage(71)];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });

    handleUserChangeImpl(ctx, makeUser());
    await flush();
    await flush();

    expect(ctx.unreadDividerMessageId.set).toHaveBeenCalledWith(70);
  });

  it('scrolls to the bottom when no divider can be determined', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 500));
    const messages = [makeMessage(100, 'me', 1), makeMessage(101, 'me', 1)];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });

    handleUserChangeImpl(ctx, makeUser());
    await flush();
    await flush();

    expect(ctx.unreadDividerMessageId.set).not.toHaveBeenCalledWith(expect.any(Number));
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });

  it('aborts when the conversation changed while getConversation was in flight', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 100));
    const ctx = makeCtx({ startFromUnreadMessages: true });
    ctx.messageListService.getFetchGeneration
      .mockReturnValueOnce(1) // captured at the start
      .mockReturnValue(2); // changed by the time the await resolves

    handleUserChangeImpl(ctx, makeUser());
    await flush();

    expect(ctx.messageListService.fetchMessagesAroundId).not.toHaveBeenCalled();
    expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
  });

  it('falls back to the latest page when getConversation rejects', async () => {
    vi.spyOn(CometChat, 'getConversation').mockRejectedValue(new Error('offline'));
    const ctx = makeCtx({ startFromUnreadMessages: true });
    handleUserChangeImpl(ctx, makeUser());
    await flush();
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
  });

  it('falls back to the latest page when the pivot fetch rejects', async () => {
    vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(2, 100));
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig([makeMessage(100)]) });
    ctx.messageListService.fetchMessagesAroundId.mockRejectedValue(new Error('nope'));

    handleUserChangeImpl(ctx, makeUser());
    await flush();
    await flush();

    expect(ctx.hasMorePrevious.set).toHaveBeenCalledWith(true);
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
  });

  it('uses the group id and receiver type on the group path', async () => {
    const spy = vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(0, '0'));
    const ctx = makeCtx({ startFromUnreadMessages: true });
    handleGroupChangeImpl(ctx, makeGroup('g-9'));
    await flush();
    expect(spy).toHaveBeenCalledWith('g-9', expect.any(String));
  });

  it('is skipped inside a thread', async () => {
    const spy = vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conversation(0, '0'));
    spy.mockClear();
    const ctx = makeCtx({ startFromUnreadMessages: true, parentMessageId: 4 });
    handleUserChangeImpl(ctx, makeUser());
    await flush();

    expect(spy).not.toHaveBeenCalled();
    expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// scrollToFirstUnreadOrBottomImpl
// ---------------------------------------------------------------------------

describe('scrollToFirstUnreadOrBottomImpl', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scrolls to the bottom when the feature is off', () => {
    const ctx = makeCtx({ startFromUnreadMessages: false, messages: sig([makeMessage(1)]) });
    scrollToFirstUnreadOrBottomImpl(ctx);
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
    expect(ctx.unreadDividerMessageId.set).not.toHaveBeenCalled();
  });

  it('scrolls to the bottom when everything has been read', () => {
    const messages = [makeMessage(1, 'bob', 999), makeMessage(2, 'me')];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });
    scrollToFirstUnreadOrBottomImpl(ctx);
    expect(ctx.scrollToBottomAfterLoad).toHaveBeenCalled();
  });

  it('marks the first unread message and counts the rest', async () => {
    vi.useFakeTimers();
    const messages = [makeMessage(1, 'bob', 999), makeMessage(2), makeMessage(3), makeMessage(4, 'me')];
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig(messages) });

    scrollToFirstUnreadOrBottomImpl(ctx);

    expect(ctx.unreadDividerMessageId.set).toHaveBeenCalledWith(2);
    expect(ctx.markedAsUnreadCount.set).toHaveBeenCalledWith(2);
    expect(ctx.showScrollToBottom.set).toHaveBeenCalledWith(true);
    expect(ctx.scrollToBottomAfterLoad).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(ctx.scrollToMessageWithRetry).toHaveBeenCalledWith(2, 10);
  });

  it('pauses pagination while the scroll settles', () => {
    const ctx = makeCtx({ startFromUnreadMessages: true, messages: sig([makeMessage(2)]) });
    scrollToFirstUnreadOrBottomImpl(ctx);
    expect(ctx.hasMorePrevious.set).toHaveBeenCalledWith(false);
    expect(ctx.hasMoreNext.set).toHaveBeenCalledWith(false);
  });
});
