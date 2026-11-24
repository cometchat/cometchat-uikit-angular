/**
 * Scroll handler functions for CometChatMessageList.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { sdkConnected } from '../../utils/offline/offline-gate';
import { highlightAndScrollToElement as highlightAndScrollToElementUtil } from './cometchat-message-list.scroll-utils';

export interface ScrollHandlerContext {
  /** True once the list is destroyed: deferred scroll work (frames, retries) must stop. */
  isDestroyed?: boolean;
  listContainer: any;
  scrollTopAnchor: any;
  scrollBottomAnchor: any;
  isFetchingPrevious: any;
  isFetchingNext: any;
  hasMorePrevious: any;
  hasMoreNext: any;
  isAtBottom: any;
  showScrollToBottom: any;
  showNewMessagesBanner: any;
  newMessagesCount: any;
  unreadMessages: any;
  markedAsUnreadCount: any;
  unreadDividerMessageId: any;
  stickyDateTimestamp: any;
  showStickyDateHeader: any;
  hideStickyDate: boolean;
  scrollHeightBeforeLoad: number;
  BOTTOM_THRESHOLD: number;
  user?: CometChat.User;
  group?: CometChat.Group;
  loggedInUser: CometChat.User | null;
  messageListService: any;
  conversationsService: any;
  cdr: any;
  messagesWithSeparators: () => any[];
  messages: () => CometChat.BaseMessage[];
  isReceiverMessage: (msg: CometChat.BaseMessage) => boolean;
  getConversationId: () => string | null;
  markMessagesReadOnScrollToBottom: () => Promise<void>;
  scrollToBottomAfterLoad: () => void;
  publishActiveChatChanged: () => void;
  announceLoadingMore: () => void;
}

/**
 * Whether this direction may still load more. Offline a read past the saved
 * messages says no more only for now: just an empty server page, online, ends
 * the list (UIK-READ-03), so the next scroll or the footer's tap reads again.
 */
function mayLoadMore(ctx: ScrollHandlerContext, hasMore: boolean): boolean {
  return hasMore || ctx.messageListService.offlineFooter?.() === 'connect_to_load_more';
}

/**
 * Offline, the "Connect to load more" footer shows at the top and the last
 * older read found nothing cached either: a scroll there reads nothing more
 * until the connection is back (the footer is retryable), so it does not issue
 * one refused older read per scroll. Older cached pages still load, and the
 * footer's tap still reads. With offline off the footer never shows.
 */
function waitsForConnection(ctx: ScrollHandlerContext): boolean {
  const service = ctx.messageListService;
  return (
    service?.offlineFooter?.() === 'connect_to_load_more' &&
    service.offlinePreviousExhausted === true &&
    !service.offlineFooterRetryable?.() &&
    !sdkConnected()
  );
}

export async function handleScrollToTopImpl(ctx: ScrollHandlerContext): Promise<void> {
  if (ctx.isFetchingPrevious()) { return; }
  if (waitsForConnection(ctx)) {
    return;
  }
  ctx.isFetchingPrevious.set(true);
  const container = ctx.listContainer?.nativeElement;
  const scrollHeightBefore = container?.scrollHeight || 0;
  const scrollTopBefore = container?.scrollTop || 0;
  // The chat can change while the page loads (the user opens another one). The service then
  // drops the stale page and answers false, which is not the new chat's "no more history":
  // leave the new chat's state alone.
  const generation = ctx.messageListService.getFetchGeneration?.();
  try {
    const hasMore = await ctx.messageListService.fetchPreviousMessages();
    if (ctx.messageListService.getFetchGeneration?.() !== generation) return;
    ctx.hasMorePrevious.set(mayLoadMore(ctx, hasMore));
    if (container) {
      requestAnimationFrame(() => {
        const scrollHeightAfter = container.scrollHeight;
        const scrollHeightDiff = scrollHeightAfter - scrollHeightBefore;
        container.scrollTop = scrollTopBefore + scrollHeightDiff;
      });
    }
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error fetching previous messages:', error);
  } finally {
    ctx.isFetchingPrevious.set(false);
  }
}

export function handleScrollToBottomImpl(ctx: ScrollHandlerContext): void {
  if (ctx.isFetchingNext() || !ctx.hasMoreNext()) { return; }
  const container = ctx.listContainer?.nativeElement;
  const scrollTopBefore = container?.scrollTop || 0;
  ctx.isFetchingNext.set(true);
  // As above: a page for a chat that has since been replaced says nothing about the new one.
  const generation = ctx.messageListService.getFetchGeneration?.();
  ctx.messageListService.fetchNextMessages()
    .then((hasMore: boolean) => {
      ctx.isFetchingNext.set(false);
      if (ctx.messageListService.getFetchGeneration?.() !== generation) return;
      ctx.hasMoreNext.set(mayLoadMore(ctx, hasMore));
      if (container) { requestAnimationFrame(() => { container.scrollTop = scrollTopBefore; }); }
    })
    .catch((error: unknown) => {
      CometChatLogger.error('CometChatMessageList', 'Error fetching next messages:', error);
      ctx.isFetchingNext.set(false);
    });
}

export function saveScrollPositionImpl(ctx: ScrollHandlerContext): void {
  if (ctx.listContainer?.nativeElement) { (ctx as any).scrollHeightBeforeLoad = ctx.listContainer.nativeElement.scrollHeight; }
}

export function restoreScrollPositionImpl(ctx: ScrollHandlerContext): void {
  if (ctx.listContainer?.nativeElement) {
    const newScrollHeight = ctx.listContainer.nativeElement.scrollHeight;
    const scrollDiff = newScrollHeight - ctx.scrollHeightBeforeLoad;
    ctx.listContainer.nativeElement.scrollTop += scrollDiff;
  }
}

export function saveScrollPositionForReactionImpl(ctx: ScrollHandlerContext): void {
  if (!ctx.listContainer?.nativeElement) return;
  const container = ctx.listContainer.nativeElement;
  const scrollTopBefore = container.scrollTop;
  const scrollHeightBefore = container.scrollHeight;
  requestAnimationFrame(() => {
    if (!ctx.listContainer?.nativeElement) return;
    const scrollHeightAfter = container.scrollHeight;
    const heightDiff = scrollHeightAfter - scrollHeightBefore;
    if (heightDiff !== 0) { container.scrollTop = scrollTopBefore + heightDiff; }
  });
}

export function updateStickyDateImpl(ctx: ScrollHandlerContext): void {
  if (ctx.hideStickyDate || !ctx.listContainer?.nativeElement) { ctx.showStickyDateHeader.set(false); return; }
  const container = ctx.listContainer.nativeElement;
  const items = ctx.messagesWithSeparators();
  if (items.length === 0) { ctx.showStickyDateHeader.set(false); return; }
  const messageElements = container.querySelectorAll('.cometchat-message-list__message');
  for (let i = 0; i < messageElements.length; i++) {
    const element = messageElements[i] as HTMLElement;
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (rect.top >= containerRect.top) {
      const itemIndex = parseInt(element.dataset['index'] || '0', 10);
      const item = items[itemIndex];
      if (item?.type === 'message' && item.message) {
        ctx.stickyDateTimestamp.set(item.message.getSentAt());
        ctx.showStickyDateHeader.set(container.scrollTop > 50);
      }
      break;
    }
  }
}

export function updateIsAtBottomImpl(ctx: ScrollHandlerContext): void {
  if (!ctx.listContainer?.nativeElement) { return; }
  const container = ctx.listContainer.nativeElement;
  const wasAtBottom = ctx.isAtBottom();
  const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < ctx.BOTTOM_THRESHOLD;
  ctx.isAtBottom.set(isAtBottom);
  ctx.showScrollToBottom.set(!isAtBottom);
  if (isAtBottom) {
    ctx.showNewMessagesBanner.set(false);
    ctx.newMessagesCount.set(0);
    if (ctx.markedAsUnreadCount() > 0) {
      ctx.markedAsUnreadCount.set(0);
      // Clear the unread divider when user reaches the bottom
      ctx.unreadDividerMessageId.set(null);
      const messages = ctx.messages();
      if (messages.length > 0 && ctx.loggedInUser) {
        let latestReceiverMsg: CometChat.BaseMessage | null = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (ctx.isReceiverMessage(messages[i])) { latestReceiverMsg = messages[i]; break; }
        }
        if (latestReceiverMsg) {
          const msgToRead = latestReceiverMsg;
          ctx.messageListService.markAsRead(msgToRead).then(() => {
            const conversationId = ctx.getConversationId();
            if (conversationId) { ctx.conversationsService.updateConversationUnreadCount(conversationId, 0); }
          }).catch((err: unknown) => {
            CometChatLogger.error('CometChatMessageList', 'markAsRead after markAsUnread failed', err);
          });
        }
      }
    }
    if (!wasAtBottom && ctx.unreadMessages().length > 0) { ctx.markMessagesReadOnScrollToBottom(); }
  }
}

export function scrollToBottomImpl(ctx: ScrollHandlerContext, smooth = false): void {
  if (!ctx.listContainer?.nativeElement) { return; }
  if (ctx.hasMoreNext()) {
    const user = ctx.user;
    const group = ctx.group;
    ctx.showScrollToBottom.set(false);
    ctx.showNewMessagesBanner.set(false);
    ctx.newMessagesCount.set(0);
    ctx.hasMorePrevious.set(true);
    ctx.hasMoreNext.set(false);
    if (user) {
      ctx.messageListService.setUser(user);
      ctx.messageListService.fetchPreviousMessages().then(() => { ctx.scrollToBottomAfterLoad(); });
    } else if (group) {
      ctx.messageListService.setGroup(group);
      ctx.messageListService.fetchPreviousMessages().then(() => { ctx.scrollToBottomAfterLoad(); });
    }
    return;
  }
  ctx.showNewMessagesBanner.set(false);
  ctx.newMessagesCount.set(0);
  if (ctx.unreadMessages().length > 0) { ctx.markMessagesReadOnScrollToBottom(); }
  ctx.listContainer.nativeElement.scrollTo({
    top: ctx.listContainer.nativeElement.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

export function scrollToBottomAfterLoadImpl(ctx: ScrollHandlerContext): void {
  requestAnimationFrame(() => {
    if (ctx.isDestroyed) return;
    setTimeout(() => { scrollToBottomWithRetryImpl(ctx, 3); }, 0);
  });
}

export function scrollToBottomWithRetryImpl(ctx: ScrollHandlerContext, retries: number): void {
  if (ctx.isDestroyed || !ctx.listContainer?.nativeElement) return;
  const container = ctx.listContainer.nativeElement;
  container.scrollTop = container.scrollHeight;
  if (retries > 0) setTimeout(() => scrollToBottomWithRetryImpl(ctx, retries - 1), 100);
}

/** Paging flags from before a jump still in flight, per list, so overlapping jumps restore the first ones. */
const flagsBeforeJump = new WeakMap<object, { previous: boolean; next: boolean; pending: number }>();

export function scrollToMessageImpl(ctx: ScrollHandlerContext, messageId: string | number): void {
  if (!ctx.listContainer?.nativeElement) { return; }
  const messageElement = ctx.listContainer.nativeElement.querySelector(`[data-message-id="${messageId}"]`);
  if (messageElement) {
    highlightAndScrollToElementUtil(messageElement);
  } else {
    const numericId = typeof messageId === 'string' ? parseInt(messageId, 10) : messageId;
    if (isNaN(numericId)) return;
    const flags = flagsBeforeJump.get(ctx) ?? { previous: ctx.hasMorePrevious(), next: ctx.hasMoreNext(), pending: 0 };
    flags.pending++;
    flagsBeforeJump.set(ctx, flags);
    const generation = ctx.messageListService.getFetchGeneration?.();
    ctx.hasMorePrevious.set(false);
    ctx.hasMoreNext.set(false);
    ctx.messageListService.fetchMessagesAroundId(numericId)
      .then(() => {
        ctx.cdr.markForCheck();
        if (generation !== undefined && ctx.messageListService.getFetchGeneration?.() === generation) {
          // The rows were kept (ENG-57322: offline, the target could not be read): paging
          // goes on as before the jump, and there is nothing to scroll to.
          if (flags.pending === 1) {
            ctx.hasMorePrevious.set(flags.previous);
            ctx.hasMoreNext.set(flags.next);
          }
          return;
        }
        scrollToMessageWithRetryImpl(ctx, messageId, 10);
      })
      .catch((error: unknown) => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching messages around ID for scroll:', error);
      })
      .finally(() => {
        if (--flags.pending === 0) flagsBeforeJump.delete(ctx);
      });
  }
}

export function scrollToMessageWithRetryImpl(ctx: ScrollHandlerContext, messageId: string | number, retries: number): void {
  if (ctx.isDestroyed || retries <= 0 || !ctx.listContainer?.nativeElement) return;
  requestAnimationFrame(() => {
    if (ctx.isDestroyed) return;
    setTimeout(() => {
      if (ctx.isDestroyed) return;
      const messageElement = ctx.listContainer?.nativeElement?.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        highlightAndScrollToElementUtil(messageElement);
        setTimeout(() => {
          if (ctx.isDestroyed) return;
          ctx.hasMorePrevious.set(true);
          ctx.hasMoreNext.set(true);
        }, 300);
      } else if (retries > 1) {
        scrollToMessageWithRetryImpl(ctx, messageId, retries - 1);
      }
    }, 50);
  });
}

export function disconnectObserversImpl(ctx: ScrollHandlerContext): void {
  (ctx as any).scrollTopObserver?.disconnect();
  (ctx as any).scrollBottomObserver?.disconnect();
}
