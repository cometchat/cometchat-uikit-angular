import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';

export async function markInitialMessagesAsReadImpl(ctx: any): Promise<void> {
  const messages = ctx.messages();
  if (messages.length === 0 || !ctx.loggedInUser) { return; }
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg.getReadAt() && ctx.isReceiverMessage(msg)) {
      try {
        await ctx.messageListService.markAsRead(msg);
        const messageId = msg.getId();
        if (messageId) {
          ctx.messageListService.updateLocalReadStatus([messageId]);
        }
        ctx.notifyUnreadCountChange(0);
        ctx.notifyMessagesRead(msg);
        break;
      } catch (error) {
        CometChatLogger.error(
          'CometChatMessageList',
          'Error marking messages as read on initial load:',
          error
        );
      }
    }
  }
}

export async function handleRealtimeMessageReceiptImpl(ctx: any, message: CometChat.BaseMessage): Promise<void> {
  if (!ctx.loggedInUser) { return; }
  if (!ctx.isReceiverMessage(message)) { return; }
  const atBottom = ctx.isAtBottom();
  if (atBottom) {
    const messageId = message.getId();
    if (messageId) {
      ctx.messageListService.updateLocalReadStatus([messageId]);
    }
    try {
      await ctx.messageListService.markAsRead(message);
      // The receipt above marks this ONE message over the websocket. Clearing
      // the conversation's unread count on the server needs the HTTP call too,
      // or the badge returns on reload and on the user's other devices — which
      // is exactly the case a message arriving while you are already at the
      // bottom produces.
      //
      // Deliberately last, and optional: local state is already correct, so a
      // server-side extra must not be able to undo it.
      void ctx.messageListService.markConversationAsRead?.();
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error marking message as read:', error);
    }
  } else {
    ctx.unreadMessages.update((msgs: CometChat.BaseMessage[]) => [...msgs, message]);
  }
}

export async function markMessagesReadOnScrollToBottomImpl(ctx: any): Promise<void> {
  const unreadMsgs = ctx.unreadMessages();
  if (unreadMsgs.length === 0 || !ctx.loggedInUser) { return; }
  const latestMessage = ctx.getLatestReceiverMessage(unreadMsgs);
  if (!latestMessage) { return; }
  const messageIds = unreadMsgs
    .map((msg: CometChat.BaseMessage) => msg.getId())
    .filter((id: number | undefined) => id !== undefined) as number[];
  ctx.unreadMessages.set([]);
  try {
    await ctx.messageListService.markAsRead(latestMessage);
    ctx.messageListService.updateLocalReadStatus(messageIds);
    ctx.notifyUnreadCountChange(0);
    ctx.notifyMessagesRead(latestMessage);
    // The receipt above marks up to ONE message over the websocket; this clears
    // the conversation's unread count on the server so it stays cleared across
    // reloads and devices. Both are needed — see markConversationAsRead.
    //
    // Deliberately last, and optional: the local state is already correct by
    // this point, so a server-side extra must not be able to undo it.
    void ctx.messageListService.markConversationAsRead?.();
  } catch (error) {
    CometChatLogger.error(
      'CometChatMessageList',
      'Error marking messages as read on scroll to bottom:',
      error
    );
  }
}

export async function markAsReadWithRetryImpl(ctx: any, message: CometChat.BaseMessage, retryCount = 0): Promise<void> {
  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [1000, 2000];
  try {
    await ctx.messageListService.markAsRead(message);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      CometChatLogger.warn('CometChatMessageList', `Retrying markAsRead after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return markAsReadWithRetryImpl(ctx, message, retryCount + 1);
    } else {
      CometChatLogger.error('CometChatMessageList', 'markAsReadWithRetry failed after max retries:', error);
      if (error instanceof CometChat.CometChatException) {
        ctx.error.emit(error);
      }
    }
  }
}
