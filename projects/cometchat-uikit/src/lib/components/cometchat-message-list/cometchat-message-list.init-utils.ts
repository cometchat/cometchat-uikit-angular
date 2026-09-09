import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatUIEvents} from '../../events/CometChatUIEvents';
import {States} from '../../Enums/Enums';

export function initializeServiceImpl(self: any): void {
  if (self.user) { self.messageListService.setUser(self.user); } else if (self.group) { self.messageListService.setGroup(self.group); }
  if (self.isAgentChat) { self.messageListService.setIsAgentChat(true); }
  if (self.parentMessageId) { self.messageListService.setParentMessageId(self.parentMessageId); }
  // Subscription state only — the scoping id above is derived from the same
  // message when the caller passes one.
  self.messageListService.setParentMessage(self.parentMessage ?? null);
  if (self.messagesRequestBuilder) { self.messageListService.setMessagesRequestBuilder(self.messagesRequestBuilder); }
  if (self.hideGroupActionMessages) { self.messageListService.setHideGroupActionMessages(self.hideGroupActionMessages); }
  if (self.isAgentChat && !self.parentMessageId) {
    // Agent chat without parentMessageId: show empty state immediately (no shimmer),
    // only display real-time messages as they arrive.
    // When loadLastAgentConversation is true, keep shimmer visible while parent
    // fetches history in the background and sets parentMessageId once resolved.
    // Reset loadingState since no fetch will happen (setUser/setGroup sets it to true).
    self.messageListService.setLoadingState(false);
    self.listState.set(self.loadLastAgentConversation ? States.loading : States.empty);
    return;
  }
  if (self.goToMessageId) {
    const numericId = typeof self.goToMessageId === 'string'
      ? parseInt(self.goToMessageId, 10)
      : Number(self.goToMessageId);
    if (!isNaN(numericId)) {
      self.hasMorePrevious.set(false);
      self.hasMoreNext.set(false);
      self.messageListService.fetchMessagesAroundId(numericId).then(() => {
        self.cdr.markForCheck();
        self.scrollToMessageWithRetry(self.goToMessageId!, 10);
        self.publishActiveChatChanged();
      }).catch((error: unknown) => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching messages around goToMessageId:', error);
      });
      return;
    }
  }
  self.messageListService.fetchPreviousMessages().then(() => {
    self.scrollToBottomAfterLoad();
    self.publishActiveChatChanged();
  });
}

export function publishActiveChatChangedImpl(self: any): void {
  if (!self.isFirstLoad || self.parentMessageId) { return; }
  self.isFirstLoad = false;
  const messages = self.messages();
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
  CometChatUIEvents.ccActiveChatChanged.next({
    user: self.user,
    group: self.group,
    message: lastMessage,
    unreadMessageCount: 0,
  });
}

export function setupIntersectionObserversImpl(self: any): void {
  if (!self.scrollTopAnchor?.nativeElement || !self.scrollBottomAnchor?.nativeElement) { return; }
  self.disconnectObservers();
  self.scrollTopObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !self.isFetchingPrevious() && self.hasMorePrevious()) {
        self.handleScrollToTop();
      }
    },
    {
      root: self.listContainer?.nativeElement,
      threshold: 0.1,
      rootMargin: '100px 0px 0px 0px',
    }
  );
  self.scrollTopObserver.observe(self.scrollTopAnchor.nativeElement);
  self.scrollBottomObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        self.handleScrollToBottom();
      }
    },
    { root: self.listContainer?.nativeElement, threshold: 0.1 }
  );
  self.scrollBottomObserver.observe(self.scrollBottomAnchor.nativeElement);
}
