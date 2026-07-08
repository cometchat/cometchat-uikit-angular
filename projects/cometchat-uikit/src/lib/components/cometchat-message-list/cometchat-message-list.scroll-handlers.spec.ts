/**
 * cometchat-message-list.scroll-handlers Tests
 *
 * Covers: handleScrollToTopImpl, handleScrollToBottomImpl,
 *         saveScrollPositionImpl, restoreScrollPositionImpl,
 *         updateIsAtBottomImpl, scrollToBottomImpl,
 *         scrollToMessageImpl, scrollToBottomWithRetryImpl.
 *
 * @module components/cometchat-message-list/scroll-handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleScrollToTopImpl,
  handleScrollToBottomImpl,
  saveScrollPositionImpl,
  restoreScrollPositionImpl,
  updateIsAtBottomImpl,
  scrollToBottomImpl,
  scrollToMessageImpl,
  scrollToBottomWithRetryImpl,
  ScrollHandlerContext,
} from './cometchat-message-list.scroll-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScrollContainer(scrollTop = 0, scrollHeight = 1000, clientHeight = 500) {
  let _scrollTop = scrollTop;
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollTop', {
    get: () => _scrollTop,
    set: (v) => { _scrollTop = v; },
    configurable: true,
  });
  Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true });
  el.scrollTo = vi.fn(({ top }: ScrollToOptions) => { _scrollTop = top ?? _scrollTop; });
  return el;
}

function makeCtx(overrides: Partial<ScrollHandlerContext> = {}): ScrollHandlerContext {
  const isFetchingPrevious = { value: false, set: vi.fn((v: boolean) => { isFetchingPrevious.value = v; }) };
  const isFetchingNext = { value: false, set: vi.fn((v: boolean) => { isFetchingNext.value = v; }) };
  const hasMorePrevious = { value: true, set: vi.fn((v: boolean) => { hasMorePrevious.value = v; }) };
  const hasMoreNext = { value: false, set: vi.fn((v: boolean) => { hasMoreNext.value = v; }) };
  const isAtBottom = { value: true, set: vi.fn((v: boolean) => { isAtBottom.value = v; }) };
  const showScrollToBottom = { value: false, set: vi.fn((v: boolean) => { showScrollToBottom.value = v; }) };
  const showNewMessagesBanner = { value: false, set: vi.fn((v: boolean) => { showNewMessagesBanner.value = v; }) };
  const newMessagesCount = { value: 0, set: vi.fn((v: number) => { newMessagesCount.value = v; }) };
  const unreadMessages = { value: [] as CometChat.BaseMessage[], set: vi.fn(), update: vi.fn() };
  const markedAsUnreadCount = { value: 0, set: vi.fn((v: number) => { markedAsUnreadCount.value = v; }) };
  const unreadDividerMessageId = { value: null, set: vi.fn() };
  const stickyDateTimestamp = { value: null, set: vi.fn() };
  const showStickyDateHeader = { value: false, set: vi.fn() };

  return {
    listContainer: null,
    scrollTopAnchor: null,
    scrollBottomAnchor: null,
    isFetchingPrevious: Object.assign(() => isFetchingPrevious.value, isFetchingPrevious),
    isFetchingNext: Object.assign(() => isFetchingNext.value, isFetchingNext),
    hasMorePrevious: Object.assign(() => hasMorePrevious.value, hasMorePrevious),
    hasMoreNext: Object.assign(() => hasMoreNext.value, hasMoreNext),
    isAtBottom: Object.assign(() => isAtBottom.value, isAtBottom),
    showScrollToBottom: Object.assign(() => showScrollToBottom.value, showScrollToBottom),
    showNewMessagesBanner: Object.assign(() => showNewMessagesBanner.value, showNewMessagesBanner),
    newMessagesCount: Object.assign(() => newMessagesCount.value, newMessagesCount),
    unreadMessages: Object.assign(() => unreadMessages.value, unreadMessages),
    markedAsUnreadCount: Object.assign(() => markedAsUnreadCount.value, markedAsUnreadCount),
    unreadDividerMessageId: Object.assign(() => unreadDividerMessageId.value, unreadDividerMessageId),
    stickyDateTimestamp: Object.assign(() => stickyDateTimestamp.value, stickyDateTimestamp),
    showStickyDateHeader: Object.assign(() => showStickyDateHeader.value, showStickyDateHeader),
    hideStickyDate: false,
    scrollHeightBeforeLoad: 0,
    BOTTOM_THRESHOLD: 50,
    user: undefined,
    group: undefined,
    loggedInUser: null,
    messageListService: {
      fetchPreviousMessages: vi.fn().mockResolvedValue(true),
      fetchNextMessages: vi.fn().mockResolvedValue(false),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      setUser: vi.fn(),
      setGroup: vi.fn(),
      fetchMessagesAroundId: vi.fn().mockResolvedValue(undefined),
    },
    conversationsService: { updateConversationUnreadCount: vi.fn() },
    cdr: { markForCheck: vi.fn() },
    messagesWithSeparators: vi.fn().mockReturnValue([]),
    messages: vi.fn().mockReturnValue([]),
    isReceiverMessage: vi.fn().mockReturnValue(true),
    getConversationId: vi.fn().mockReturnValue('conv1'),
    markMessagesReadOnScrollToBottom: vi.fn().mockResolvedValue(undefined),
    scrollToBottomAfterLoad: vi.fn(),
    publishActiveChatChanged: vi.fn(),
    announceLoadingMore: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-list.scroll-handlers', () => {

  // ==================== handleScrollToTopImpl ====================

  describe('handleScrollToTopImpl', () => {
    it('should return early when already fetching previous', async () => {
      const ctx = makeCtx();
      ctx.isFetchingPrevious.set(true);
      await handleScrollToTopImpl(ctx);
      expect(ctx.messageListService.fetchPreviousMessages).not.toHaveBeenCalled();
    });

    it('should call fetchPreviousMessages', async () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      await handleScrollToTopImpl(ctx);
      expect(ctx.messageListService.fetchPreviousMessages).toHaveBeenCalled();
    });

    it('should set isFetchingPrevious to true then false', async () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      await handleScrollToTopImpl(ctx);
      expect(ctx.isFetchingPrevious.set).toHaveBeenCalledWith(true);
      expect(ctx.isFetchingPrevious.set).toHaveBeenCalledWith(false);
    });

    it('should update hasMorePrevious with the result', async () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({
        listContainer: { nativeElement: container },
        messageListService: {
          fetchPreviousMessages: vi.fn().mockResolvedValue(false),
          fetchNextMessages: vi.fn(),
          markAsRead: vi.fn(),
          setUser: vi.fn(),
          setGroup: vi.fn(),
          fetchMessagesAroundId: vi.fn(),
        },
      });
      await handleScrollToTopImpl(ctx);
      expect(ctx.hasMorePrevious.set).toHaveBeenCalledWith(false);
    });

    it('should set isFetchingPrevious to false even on error', async () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({
        listContainer: { nativeElement: container },
        messageListService: {
          fetchPreviousMessages: vi.fn().mockRejectedValue(new Error('fail')),
          fetchNextMessages: vi.fn(),
          markAsRead: vi.fn(),
          setUser: vi.fn(),
          setGroup: vi.fn(),
          fetchMessagesAroundId: vi.fn(),
        },
      });
      await handleScrollToTopImpl(ctx);
      expect(ctx.isFetchingPrevious.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleScrollToBottomImpl ====================

  describe('handleScrollToBottomImpl', () => {
    it('should return early when already fetching next', () => {
      const ctx = makeCtx();
      ctx.isFetchingNext.set(true);
      handleScrollToBottomImpl(ctx);
      expect(ctx.messageListService.fetchNextMessages).not.toHaveBeenCalled();
    });

    it('should return early when hasMoreNext is false', () => {
      const ctx = makeCtx();
      ctx.hasMoreNext.set(false);
      handleScrollToBottomImpl(ctx);
      expect(ctx.messageListService.fetchNextMessages).not.toHaveBeenCalled();
    });

    it('should call fetchNextMessages when hasMoreNext is true', async () => {
      const ctx = makeCtx();
      ctx.hasMoreNext.set(true);
      handleScrollToBottomImpl(ctx);
      await new Promise(r => setTimeout(r, 10));
      expect(ctx.messageListService.fetchNextMessages).toHaveBeenCalled();
    });
  });

  // ==================== saveScrollPositionImpl ====================

  describe('saveScrollPositionImpl', () => {
    it('should save scrollHeight to scrollHeightBeforeLoad', () => {
      const container = makeScrollContainer(200, 1500, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      saveScrollPositionImpl(ctx);
      expect((ctx as any).scrollHeightBeforeLoad).toBe(1500);
    });

    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => saveScrollPositionImpl(ctx)).not.toThrow();
    });
  });

  // ==================== restoreScrollPositionImpl ====================

  describe('restoreScrollPositionImpl', () => {
    it('should adjust scrollTop by height difference', () => {
      let scrollTop = 200;
      const container = document.createElement('div');
      Object.defineProperty(container, 'scrollTop', {
        get: () => scrollTop,
        set: (v) => { scrollTop = v; },
        configurable: true,
      });
      Object.defineProperty(container, 'scrollHeight', { get: () => 1500, configurable: true });

      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      (ctx as any).scrollHeightBeforeLoad = 1000;
      restoreScrollPositionImpl(ctx);
      // diff = 1500 - 1000 = 500; new scrollTop = 200 + 500 = 700
      expect(scrollTop).toBe(700);
    });

    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => restoreScrollPositionImpl(ctx)).not.toThrow();
    });
  });

  // ==================== updateIsAtBottomImpl ====================

  describe('updateIsAtBottomImpl', () => {
    it('should set isAtBottom to true when near bottom', () => {
      // scrollHeight=1000, scrollTop=460, clientHeight=500 → distance=40 < threshold=50
      const container = makeScrollContainer(460, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container }, BOTTOM_THRESHOLD: 50 });
      updateIsAtBottomImpl(ctx);
      expect(ctx.isAtBottom.set).toHaveBeenCalledWith(true);
    });

    it('should set isAtBottom to false when far from bottom', () => {
      // distance = 1000 - 0 - 500 = 500 > 50
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container }, BOTTOM_THRESHOLD: 50 });
      updateIsAtBottomImpl(ctx);
      expect(ctx.isAtBottom.set).toHaveBeenCalledWith(false);
    });

    it('should set showScrollToBottom to false when at bottom', () => {
      const container = makeScrollContainer(500, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container }, BOTTOM_THRESHOLD: 50 });
      updateIsAtBottomImpl(ctx);
      expect(ctx.showScrollToBottom.set).toHaveBeenCalledWith(false);
    });

    it('should set showScrollToBottom to true when not at bottom', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container }, BOTTOM_THRESHOLD: 50 });
      updateIsAtBottomImpl(ctx);
      expect(ctx.showScrollToBottom.set).toHaveBeenCalledWith(true);
    });

    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => updateIsAtBottomImpl(ctx)).not.toThrow();
    });
  });

  // ==================== scrollToBottomImpl ====================

  describe('scrollToBottomImpl', () => {
    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => scrollToBottomImpl(ctx)).not.toThrow();
    });

    it('should scroll to bottom when hasMoreNext is false', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      ctx.hasMoreNext.set(false);
      scrollToBottomImpl(ctx);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'auto' });
    });

    it('should use smooth behavior when smooth=true', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      ctx.hasMoreNext.set(false);
      scrollToBottomImpl(ctx, true);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    });

    it('should clear showNewMessagesBanner', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      ctx.hasMoreNext.set(false);
      scrollToBottomImpl(ctx);
      expect(ctx.showNewMessagesBanner.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== scrollToBottomWithRetryImpl ====================

  describe('scrollToBottomWithRetryImpl', () => {
    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => scrollToBottomWithRetryImpl(ctx, 0)).not.toThrow();
    });

    it('should set scrollTop to scrollHeight', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      vi.useFakeTimers();
      scrollToBottomWithRetryImpl(ctx, 0);
      expect(container.scrollTop).toBe(1000);
      vi.useRealTimers();
    });

    it('should retry the specified number of times', () => {
      const container = makeScrollContainer(0, 1000, 500);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      vi.useFakeTimers();
      scrollToBottomWithRetryImpl(ctx, 2);
      // Initial call sets scrollTop
      expect(container.scrollTop).toBe(1000);
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(100);
      vi.useRealTimers();
    });
  });

  // ==================== scrollToMessageImpl ====================

  describe('scrollToMessageImpl', () => {
    it('should not throw when listContainer is null', () => {
      const ctx = makeCtx({ listContainer: null });
      expect(() => scrollToMessageImpl(ctx, 42)).not.toThrow();
    });

    it('should call scrollIntoView when message element is found', () => {
      const container = document.createElement('div');
      const msgEl = document.createElement('div');
      msgEl.setAttribute('data-message-id', '42');
      msgEl.scrollIntoView = vi.fn();
      container.appendChild(msgEl);
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      scrollToMessageImpl(ctx, 42);
      expect(msgEl.scrollIntoView).toHaveBeenCalled();
    });

    it('should call fetchMessagesAroundId when element not found', async () => {
      const container = document.createElement('div');
      const ctx = makeCtx({ listContainer: { nativeElement: container } });
      scrollToMessageImpl(ctx, 999);
      await new Promise(r => setTimeout(r, 10));
      expect(ctx.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(999);
    });
  });
});
