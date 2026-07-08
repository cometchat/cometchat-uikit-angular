import {CometChat} from '@cometchat/chat-sdk-javascript';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatUIKitConstants} from '../../constants';
import {States} from '../../Enums/Enums';

export function handleConversationChangeImpl(ctx: any): void {
  ctx.footerPanelConfig.set(null);
  ctx.showFooterPanel.set(false);
  ctx.pendingReadReceipts.clear();
  ctx.showScrollToBottom.set(false);
  ctx.showNewMessagesBanner.set(false);
  ctx.newMessagesCount.set(0);
  ctx.hasMorePrevious.set(true);
  ctx.hasMoreNext.set(false);
  ctx.isFirstLoad = true;
  // ENG-35029: Clear stale error state before switching conversations.
  ctx.messageListService.clearError();
  if (ctx.user) {
    ctx.messageListService.setUser(ctx.user);
    if (ctx.isAgentChat && !ctx.parentMessageId) {
      ctx.messageListService.setLoadingState(false);
      // When loadLastAgentConversation is true, keep shimmer visible while
      // the parent fetches history in the background. The parent will set
      // parentMessageId once resolved, triggering a re-fetch.
      ctx.listState.set(ctx.loadLastAgentConversation ? States.loading : States.empty);
      return;
    }
    if (ctx.goToMessageId) {
      const numericId = typeof ctx.goToMessageId === 'string'
        ? parseInt(ctx.goToMessageId, 10)
        : Number(ctx.goToMessageId);
      if (!isNaN(numericId)) {
        ctx.hasMorePrevious.set(false);
        ctx.hasMoreNext.set(false);
        ctx.messageListService.fetchMessagesAroundId(numericId).then(() => {
          ctx.cdr.markForCheck();
          ctx.scrollToMessageWithRetry(ctx.goToMessageId, 10);
          ctx.publishActiveChatChanged();
        }).catch((error: unknown) => {
          CometChatLogger.error('CometChatMessageList', 'Error fetching messages around goToMessageId on conversation change:', error);
        });
        return;
      }
    }
    ctx.messageListService.fetchPreviousMessages().then(() => {
      ctx.scrollToBottomAfterLoad();
      ctx.publishActiveChatChanged();
    });
  } else if (ctx.group) {
    ctx.messageListService.setGroup(ctx.group);
    if (ctx.isAgentChat && !ctx.parentMessageId) {
      ctx.messageListService.setLoadingState(false);
      ctx.listState.set(ctx.loadLastAgentConversation ? States.loading : States.empty);
      return;
    }
    if (ctx.goToMessageId) {
      const numericId = typeof ctx.goToMessageId === 'string'
        ? parseInt(ctx.goToMessageId, 10)
        : Number(ctx.goToMessageId);
      if (!isNaN(numericId)) {
        ctx.hasMorePrevious.set(false);
        ctx.hasMoreNext.set(false);
        ctx.messageListService.fetchMessagesAroundId(numericId).then(() => {
          ctx.cdr.markForCheck();
          ctx.scrollToMessageWithRetry(ctx.goToMessageId, 10);
          ctx.publishActiveChatChanged();
        }).catch((error: unknown) => {
          CometChatLogger.error('CometChatMessageList', 'Error fetching messages around goToMessageId on conversation change:', error);
        });
        return;
      }
    }
    ctx.messageListService.fetchPreviousMessages().then(() => {
      ctx.scrollToBottomAfterLoad();
      ctx.publishActiveChatChanged();
    });
  } else {
    ctx.messageListService.clearConversation();
  }
}

export function handleParentMessageIdChangeImpl(ctx: any): void {
  if (ctx.parentMessageId) {
    ctx.messageListService.setParentMessageId(ctx.parentMessageId);
    if (ctx.isAgentChat) {
      if (ctx.user) {
        ctx.messageListService.setUser(ctx.user);
      } else if (ctx.group) {
        ctx.messageListService.setGroup(ctx.group);
      }
    }
    ctx.messageListService.clearMessages();
    ctx.messageListService.fetchPreviousMessages().then(() => {
      ctx.scrollToBottomAfterLoad();
    });
  } else if (ctx.isAgentChat) {
    ctx.messageListService.setParentMessageId(null);
    ctx.messageListService.clearMessages();
    ctx.messageListService.setLoadingState(false);
    ctx.listState.set(States.empty);
  }
}

export function subscribeToChatStateServiceImpl(ctx: any): void {
  ctx.chatStateService.activeUser$.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((user: CometChat.User | null) => {
    if (user) {
      ctx.pendingUser = user;
      ctx.pendingGroup = null;
      scheduleDeferredConversationChangeImpl(ctx);
    }
  });
  ctx.chatStateService.activeGroup$.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((group: CometChat.Group | null) => {
    if (group) {
      ctx.pendingGroup = group;
      ctx.pendingUser = null;
      scheduleDeferredConversationChangeImpl(ctx);
    }
  });
}

export function scheduleDeferredConversationChangeImpl(ctx: any): void {
  if (ctx.conversationChangeScheduled) { return; }
  ctx.conversationChangeScheduled = true;
  queueMicrotask(() => {
    ctx.conversationChangeScheduled = false;
    if (ctx.pendingUser) {
      const user = ctx.pendingUser;
      ctx.pendingUser = null;
      handleUserChangeImpl(ctx, user);
    } else if (ctx.pendingGroup) {
      const group = ctx.pendingGroup;
      ctx.pendingGroup = null;
      handleGroupChangeImpl(ctx, group);
    }
  });
}

export function handleUserChangeImpl(ctx: any, user: CometChat.User): void {
  ctx.footerPanelConfig.set(null);
  ctx.showFooterPanel.set(false);
  ctx.showScrollToBottom.set(false);
  ctx.showNewMessagesBanner.set(false);
  ctx.newMessagesCount.set(0);
  ctx.hasMorePrevious.set(true);
  ctx.hasMoreNext.set(false);
  ctx.unreadDividerMessageId.set(null);
  ctx.markedAsUnreadCount.set(0);
  ctx.lastUnreadMarkedMessageId.set(null);
  // ENG-35029: Explicitly clear any error state from the previous conversation
  // before starting the new fetch, so the error effect doesn't fire with stale data.
  ctx.messageListService.clearError();
  ctx.user = user;
  ctx.group = undefined;
  if (ctx.parentMessageId) {
    ctx.messageListService.setParentMessageId(ctx.parentMessageId);
  }
  ctx.messageListService.setUser(user);
  if (ctx.goToMessageId) {
    const numericId = typeof ctx.goToMessageId === 'string'
      ? parseInt(ctx.goToMessageId, 10)
      : Number(ctx.goToMessageId);
    if (!isNaN(numericId)) {
      ctx.hasMorePrevious.set(false);
      ctx.hasMoreNext.set(false);
      ctx.messageListService.fetchMessagesAroundId(numericId).then(() => {
        ctx.cdr.markForCheck();
        ctx.scrollToMessageWithRetry(ctx.goToMessageId, 10);
      }).catch((error: unknown) => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching around goToMessageId in handleUserChange:', error);
      });
      return;
    }
  }
  // React UIKit pattern: fetch conversation to get lastReadMessageId and unreadCount
  if (ctx.startFromUnreadMessages && !ctx.parentMessageId) {
    fetchWithUnreadPivot(ctx, user.getUid(), CometChatUIKitConstants.MessageReceiverType.user);
  } else {
    ctx.messageListService.fetchPreviousMessages().then(() => {
      ctx.scrollToBottomAfterLoad();
      ctx.publishActiveChatChanged();
    });
  }
}

export function handleGroupChangeImpl(ctx: any, group: CometChat.Group): void {
  ctx.footerPanelConfig.set(null);
  ctx.showFooterPanel.set(false);
  ctx.showScrollToBottom.set(false);
  ctx.showNewMessagesBanner.set(false);
  ctx.newMessagesCount.set(0);
  ctx.hasMorePrevious.set(true);
  ctx.hasMoreNext.set(false);
  ctx.unreadDividerMessageId.set(null);
  ctx.markedAsUnreadCount.set(0);
  ctx.lastUnreadMarkedMessageId.set(null);
  // ENG-35029: Explicitly clear any error state from the previous conversation.
  ctx.messageListService.clearError();
  ctx.group = group;
  ctx.user = undefined;
  if (ctx.parentMessageId) {
    ctx.messageListService.setParentMessageId(ctx.parentMessageId);
  }
  ctx.messageListService.setGroup(group);
  if (ctx.goToMessageId) {
    const numericId = typeof ctx.goToMessageId === 'string'
      ? parseInt(ctx.goToMessageId, 10)
      : Number(ctx.goToMessageId);
    if (!isNaN(numericId)) {
      ctx.hasMorePrevious.set(false);
      ctx.hasMoreNext.set(false);
      ctx.messageListService.fetchMessagesAroundId(numericId).then(() => {
        ctx.cdr.markForCheck();
        ctx.scrollToMessageWithRetry(ctx.goToMessageId, 10);
      }).catch((error: unknown) => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching around goToMessageId in handleGroupChange:', error);
      });
      return;
    }
  }
  // React UIKit pattern: fetch conversation to get lastReadMessageId and unreadCount
  if (ctx.startFromUnreadMessages && !ctx.parentMessageId) {
    fetchWithUnreadPivot(ctx, group.getGuid(), CometChatUIKitConstants.MessageReceiverType.group);
  } else {
    ctx.messageListService.fetchPreviousMessages().then(() => {
      ctx.scrollToBottomAfterLoad();
      ctx.publishActiveChatChanged();
    });
  }
}

/**
 * Fetches the conversation object, checks lastReadMessageId and unreadMessageCount,
 * and either loads messages around the unread pivot or loads latest messages.
 *
 * Follows the React UIKit pattern:
 * 1. CometChat.getConversation() → get lastReadMessageId + unreadMessageCount
 * 2. If unread > 0 and lastReadMessageId exists → fetchMessagesAroundId(lastReadMessageId)
 * 3. Else → fetchPreviousMessages() and scroll to bottom
 */
async function fetchWithUnreadPivot(
  ctx: any,
  id: string,
  receiverType: string
): Promise<void> {
  // Capture generation at the start so we can abort if the conversation changes
  // while the async getConversation() call is in-flight (group-specific race condition).
  const generation = ctx.messageListService.getFetchGeneration?.() ?? 0;
  try {
    const conversation: CometChat.Conversation = await CometChat.getConversation(id, receiverType);
    // ENG-35029: Abort if the conversation changed while we were waiting for getConversation().
    // This is the group-specific race: switching groups quickly causes stale pivot data
    // to be applied to the new group's message list.
    if (ctx.messageListService.getFetchGeneration?.() !== generation) {
      return;
    }
    const lastReadMessageId = conversation.getLastReadMessageId?.();
    const unreadCount = conversation.getUnreadMessageCount?.() || 0;

    if (unreadCount > 0 && lastReadMessageId && String(lastReadMessageId) !== '0') {
      const numericLastReadId = typeof lastReadMessageId === 'string'
        ? parseInt(lastReadMessageId, 10)
        : Number(lastReadMessageId);

      if (!isNaN(numericLastReadId) && numericLastReadId > 0) {
        // Fetch messages around the last read message (bidirectional)
        ctx.hasMorePrevious.set(false);
        ctx.hasMoreNext.set(false);
        ctx.messageListService.fetchMessagesAroundId(numericLastReadId).then(() => {
          // Find the first unread message in the fetched results.
          // Strategy: find the message right after lastReadMessageId, OR
          // find the first message from another user that hasn't been read.
          const allMessages = ctx.messages();
          let dividerId: number | null = null;

          // Approach 1: Find message right after lastReadMessageId
          const lastReadIndex = allMessages.findIndex(
            (msg: CometChat.BaseMessage) => msg.getId() === numericLastReadId
          );
          if (lastReadIndex >= 0 && lastReadIndex < allMessages.length - 1) {
            dividerId = allMessages[lastReadIndex + 1].getId();
          }

          // Approach 2: If lastRead not found in array, find first unread receiver message
          if (!dividerId) {
            const loggedInUid = ctx.loggedInUser?.getUid();
            const firstUnread = allMessages.find((msg: CometChat.BaseMessage) => {
              const senderId = msg.getSender()?.getUid();
              return senderId && senderId !== loggedInUid && !msg.getReadAt();
            });
            if (firstUnread) {
              dividerId = firstUnread.getId();
            }
          }

          // Approach 3: If still nothing, use the first message with ID > lastReadId
          if (!dividerId) {
            const firstAfterRead = allMessages.find(
              (msg: CometChat.BaseMessage) => msg.getId() > numericLastReadId
            );
            if (firstAfterRead) {
              dividerId = firstAfterRead.getId();
            }
          }

          if (dividerId) {
            ctx.unreadDividerMessageId.set(dividerId);
            ctx.markedAsUnreadCount.set(unreadCount);
            ctx.showScrollToBottom.set(true);
            ctx.hasMoreNext.set(true);
            ctx.cdr.markForCheck();
            // Scroll to the first unread message
            ctx.scrollToMessageWithRetry(dividerId, 10);
            // Mark the conversation as read on the server (matches React UIKit's markConversationAsRead).
            // We do NOT call notifyUnreadCountChange(0) here — the unread divider stays visible
            // until the user scrolls to the bottom, at which point markMessagesReadOnScrollToBottom
            // clears it. We only update the server + conversation list badge.
            const allMessages = ctx.messages();
            if (allMessages.length > 0 && ctx.loggedInUser) {
              // Find the latest receiver message to mark as read
              let latestReceiverMsg: CometChat.BaseMessage | null = null;
              for (let i = allMessages.length - 1; i >= 0; i--) {
                const msg = allMessages[i];
                if (msg.getSender()?.getUid() !== ctx.loggedInUser.getUid() && !msg.getReadAt()) {
                  latestReceiverMsg = msg;
                  break;
                }
              }
              if (latestReceiverMsg) {
                // Reset the scroll-to-bottom badge immediately — the unread divider stays
                // visible but the count badge should be 0 since we've opened the chat.
                ctx.markedAsUnreadCount.set(0);
                ctx.newMessagesCount.set(0);
                ctx.messageListService.markAsRead(latestReceiverMsg).then(() => {
                  // Update conversation list badge to 0 immediately
                  const conversationId = ctx.getConversationId?.();
                  if (conversationId) {
                    ctx.conversationsService?.updateConversationUnreadCount?.(conversationId, 0);
                  }
                  ctx.notifyMessagesRead?.(latestReceiverMsg);
                }).catch((err: unknown) => {
                  CometChatLogger.error('CometChatMessageList', 'markAsRead on chat open failed:', err);
                });
              }
            }
          } else {
            // Couldn't determine first unread — just scroll to bottom
            ctx.hasMoreNext.set(true);
            ctx.scrollToBottomAfterLoad();
          }
          ctx.publishActiveChatChanged();
        }).catch((error: unknown) => {
          CometChatLogger.error('CometChatMessageList', 'Error fetching around lastReadMessageId:', error);
          // Fallback: load latest messages
          ctx.hasMorePrevious.set(true);
          ctx.messageListService.fetchPreviousMessages().then(() => {
            ctx.scrollToBottomAfterLoad();
            ctx.publishActiveChatChanged();
          });
        });
        return;
      }
    }
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error fetching conversation for unread pivot:', error);
  }

  // No unread messages or couldn't determine pivot → load latest and scroll to bottom
  ctx.messageListService.fetchPreviousMessages().then(() => {
    ctx.scrollToBottomAfterLoad();
    ctx.publishActiveChatChanged();
  });
}

export function scrollToFirstUnreadOrBottomImpl(ctx: any): void {
  if (ctx.startFromUnreadMessages) {
    const messages = ctx.messages();
    const firstUnread = messages.find(
      (msg: CometChat.BaseMessage) => !msg.getReadAt() && ctx.isReceiverMessage(msg)
    );
    if (firstUnread) {
      const firstUnreadId = firstUnread.getId();
      const unreadCount = messages.filter(
        (msg: CometChat.BaseMessage) => !msg.getReadAt() && ctx.isReceiverMessage(msg)
      ).length;
      ctx.unreadDividerMessageId.set(firstUnreadId);
      ctx.markedAsUnreadCount.set(unreadCount);
      ctx.showScrollToBottom.set(true);
      // Temporarily disable pagination observers while scrolling to the unread message.
      // scrollToMessageWithRetryImpl re-enables them after 300ms once the scroll settles.
      ctx.hasMorePrevious.set(false);
      ctx.hasMoreNext.set(false);
      requestAnimationFrame(() => {
        setTimeout(() => {
          ctx.scrollToMessageWithRetry(firstUnreadId, 10);
        }, 0);
      });
      ctx.cdr.markForCheck();
      return;
    }
  }
  ctx.scrollToBottomAfterLoad();
}
