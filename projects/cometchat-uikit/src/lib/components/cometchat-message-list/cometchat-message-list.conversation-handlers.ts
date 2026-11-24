import {CometChat} from '@cometchat/chat-sdk-javascript';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatUIKitConstants} from '../../constants';
import {States} from '../../Enums/Enums';
import {isOfflineOn} from '../../utils/offline/offline-gate';
import {getConversationTwoPhase} from '../../utils/offline/two-phase';
import {markOpeningJump} from '../../services/message-list.offline';

/**
 * Open at a message id (goToMessageId: push, deep link). With offline on and the
 * message neither cached nor reachable, the list is left on the newest cached
 * page as a normal offline open: no error, no scroll target, older messages
 * reachable. Offline off: the anchored read and the scroll, unchanged.
 */
export function openAtMessageId(ctx: any, numericId: number): Promise<void> {
  ctx.hasMorePrevious.set(false);
  ctx.hasMoreNext.set(false);
  return ctx.messageListService.fetchMessagesAroundId(numericId).then(() => {
    ctx.cdr.markForCheck();
    if (isOfflineOn() && !ctx.messages().some((m: CometChat.BaseMessage) => Number(m.getId()) === numericId)) {
      ctx.hasMorePrevious.set(true);
      ctx.scrollToBottomAfterLoad();
      return;
    }
    ctx.scrollToMessageWithRetry(ctx.goToMessageId, 10);
  });
}

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
        openAtMessageId(ctx, numericId).then(() => {
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
        openAtMessageId(ctx, numericId).then(() => {
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
      openAtMessageId(ctx, numericId).catch((error: unknown) => {
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
      openAtMessageId(ctx, numericId).catch((error: unknown) => {
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
  if (isOfflineOn()) { return fetchNewestThenUnreadPivot(ctx, id, receiverType); }
  return fetchWithUnreadPivotFromServer(ctx, id, receiverType);
}

/**
 * Offline path of the chat-open read. The cache is a hole-free newest window
 * (BEH-READ-13), so a chat must open on its newest page to paint from the
 * device (AC-2.1): an anchored first read has nothing cached and would show an
 * empty chat offline. The unread divider is placed inside that page when the
 * last-read message is in it; only when the unread run starts before it does
 * the list jump there with the anchored read, as with offline off.
 *
 * The window is positioned last (start from first unread). The newest page
 * paints first, cached then server, with the list at its top and the top
 * sentinel in view, so until the list is positioned neither scroll observer may
 * page: the top one would load an older page from there, move the rows under
 * the reader and race the positioning below. Paging resumes once it is placed.
 */
async function fetchNewestThenUnreadPivot(ctx: any, id: string, receiverType: string): Promise<void> {
  ctx.hasMorePrevious.set(false);
  ctx.hasMoreNext.set(false);
  const generation = ctx.messageListService.getFetchGeneration?.() ?? 0;
  await ctx.messageListService.fetchPreviousMessages();
  if (ctx.messageListService.getFetchGeneration?.() !== generation) return;
  // Two-phase (BEH-READ-32): offline, the device copy carries the unread
  // count and read marker, so the divider is placed without the server.
  const { value } = await getConversationTwoPhase(id, receiverType);
  const conversation: CometChat.Conversation | null = value;
  if (ctx.messageListService.getFetchGeneration?.() !== generation) return;
  const lastReadId = Number(conversation?.getLastReadMessageId?.() ?? 0);
  const unreadCount = conversation?.getUnreadMessageCount?.() || 0;
  const rows: CometChat.BaseMessage[] = ctx.messages();
  if (unreadCount > 0 && lastReadId > 0 && rows.length > 0) {
    const lastReadIndex = rows.findIndex(m => Number(m.getId()) === lastReadId);
    const oldestShown = Number(rows.find(m => Number(m.getId()) > 0)?.getId() ?? 0);
    if (lastReadIndex === -1 && oldestShown > lastReadId) {
      // The unread run starts before the newest page: jump to it with the
      // anchored read, cache first, on the conversation already read two-phase
      // (no server-only getConversation). Not cached and not reachable: the
      // newest cached page stays, with no divider and no scroll target.
      return jumpToUnreadOffline(ctx, lastReadId, unreadCount);
    }
    const divider = lastReadIndex >= 0 ? rows[lastReadIndex + 1] : undefined;
    if (divider && Number(divider.getId()) > 0) {
      ctx.unreadDividerMessageId.set(divider.getId());
      ctx.markedAsUnreadCount.set(unreadCount);
      ctx.showScrollToBottom.set(true);
      ctx.cdr.markForCheck();
      ctx.scrollToMessageWithRetry(divider.getId(), 10);
      resumePagingIfStillOff(ctx);
      ctx.publishActiveChatChanged();
      return;
    }
  }
  ctx.hasMorePrevious.set(true);
  ctx.scrollToBottomAfterLoad();
  ctx.publishActiveChatChanged();
}

/** The offline jump to the first unread message when the unread run starts before the newest page. */
async function jumpToUnreadOffline(ctx: any, lastReadId: number, unreadCount: number): Promise<void> {
  let generation = 0;
  try {
    // The open's own jump: it replaces the newest page whether or not the target is saved.
    // The jump reads the mark as it starts; one that never got that far leaves none behind.
    const unmark = markOpeningJump(ctx.messageListService);
    let around: Promise<void>;
    try {
      around = ctx.messageListService.fetchMessagesAroundId(lastReadId);
    } finally {
      unmark();
    }
    // The read resets the list synchronously, which starts its own generation;
    // a chat switch after that changes it again.
    generation = ctx.messageListService.getFetchGeneration?.() ?? 0;
    await around;
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error fetching messages around the last-read message:', error);
  }
  if (ctx.messageListService.getFetchGeneration?.() !== generation) return;
  const rows: CometChat.BaseMessage[] = ctx.messages();
  const lastReadIndex = rows.findIndex(m => Number(m.getId()) === lastReadId);
  const divider = lastReadIndex >= 0
    ? rows[lastReadIndex + 1]
    : undefined;
  if (divider && Number(divider.getId()) > 0) {
    ctx.unreadDividerMessageId.set(divider.getId());
    ctx.markedAsUnreadCount.set(unreadCount);
    ctx.showScrollToBottom.set(true);
    ctx.hasMoreNext.set(true);
    ctx.cdr.markForCheck();
    ctx.scrollToMessageWithRetry(divider.getId(), 10);
    resumePagingIfStillOff(ctx);
    ctx.publishActiveChatChanged();
    return;
  }
  // The last-read message was not reached: the newest cached page stays.
  ctx.hasMorePrevious.set(true);
  ctx.hasMoreNext.set(false);
  ctx.cdr.markForCheck();
  ctx.scrollToBottomAfterLoad();
  ctx.publishActiveChatChanged();
}

/** How long after positioning on the unread divider paging resumes if the scroll never found it. */
export const RESUME_PAGING_AFTER_MS = 1500;

/**
 * Positioning re-enables paging itself once it finds the target (300 ms after).
 * If it never does (the divider row is not rendered), older messages must stay
 * reachable, so paging resumes after a while.
 */
export function resumePagingIfStillOff(ctx: any): void {
  // The timer belongs to the chat that set it: a chat opened meanwhile has its own paging
  // (Android drops an op captured under an older list generation).
  const generation = ctx.messageListService.getFetchGeneration?.() ?? 0;
  setTimeout(() => {
    if ((ctx.messageListService.getFetchGeneration?.() ?? 0) !== generation) return;
    if (!ctx.hasMorePrevious()) ctx.hasMorePrevious.set(true);
  }, RESUME_PAGING_AFTER_MS);
}

/** The chat-open read with offline off: today's unread pivot, unchanged. */
async function fetchWithUnreadPivotFromServer(
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

  // No unread messages or couldn't determine pivot → load latest and scroll to bottom.
  // Older messages stay reachable (the offline path pauses paging until it has positioned).
  ctx.hasMorePrevious.set(true);
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
