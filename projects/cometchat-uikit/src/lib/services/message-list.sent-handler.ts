import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents, IMessages} from '../events/CometChatMessageEvents';
import {MessageStatus} from '../Enums/Enums';
import {CometChatUIKitUtility} from '../CometChatUIKitUtility';
import {CometChatLogger} from '../utils/CometChatLogger';

/**
 * Queue of sent-message events received while the message list was still loading.
 * Flushed once loading completes (see flushPendingSentMessages).
 */
const pendingSentMessages = new WeakMap<object, IMessages[]>();

export function setupSentMessageListenerImpl(ctx: any): void {
  ctx.ccMessageSentSubscription = CometChatMessageEvents.ccMessageSent.subscribe(
    (data: IMessages) => {
      handleSentMessageImpl(ctx, data);
    }
  );
}

export function setupEditedMessageListenerImpl(ctx: any): void {
  ctx.ccMessageEditedSubscription = CometChatMessageEvents.ccMessageEdited.subscribe(
    (data: IMessages) => {
      if (data.status === MessageStatus.success && data.message) {
        handleEditedMessageImpl(ctx, data.message);
      }
    }
  );
}

export function handleSentMessageImpl(ctx: any, data: IMessages): void {
  const { message, status } = data;
  if (
    !ctx.parentMessageId &&
    message.getParentMessageId() &&
    status === MessageStatus.success &&
    !ctx.isAgentChatMode
  ) {
    if (ctx.isThreadReplyForCurrentConversation(message)) {
      updateSentMessageReplyCountImpl(ctx, message);
    }
    return;
  }
  if (!ctx.isMessageForCurrentConversation(message)) { return; }

  // If the list is still loading (initial fetch in progress), queue the event
  // and process it after loading completes to avoid error-state race conditions.
  if (ctx.loadingStateSignal() === true) {
    let queue = pendingSentMessages.get(ctx);
    if (!queue) {
      queue = [];
      pendingSentMessages.set(ctx, queue);
    }
    queue.push(data);
    return;
  }

  switch (status) {
    case MessageStatus.inprogress:
      ctx.addMessage(message);
      break;
    case MessageStatus.success:
      updateSentMessageByMuidImpl(ctx, message);
      break;
    case MessageStatus.error:
      updateSentMessageByMuidImpl(ctx, message);
      break;
  }
}

/**
 * Flush any sent-message events that were queued while loading.
 * Called by the service after fetchPreviousMessages / fetchNextMessages completes.
 *
 * Skips `inprogress` messages whose final `success` version is already present
 * in the fetched list (matched by MUID or message ID) to avoid duplicates.
 */
export function flushPendingSentMessages(ctx: any): void {
  const queue = pendingSentMessages.get(ctx);
  if (!queue || queue.length === 0) return;
  pendingSentMessages.delete(ctx);
  for (const data of queue) {
    const { message, status } = data;
    if (!ctx.isMessageForCurrentConversation(message)) continue;
    switch (status) {
      case MessageStatus.inprogress: {
        // Skip if the message already exists in the list (fetched from server)
        const muid = message.getMuid?.();
        const alreadyByMuid = muid ? ctx.messageMuidMap.get(muid) : undefined;
        const messageId = message.getId();
        const alreadyById = messageId ? ctx.messageIdMap.get(ctx.normalizeMessageId(messageId)) : undefined;
        if (!alreadyByMuid && !alreadyById) {
          ctx.addMessage(message);
        }
        break;
      }
      case MessageStatus.success:
        updateSentMessageByMuidImpl(ctx, message);
        break;
      case MessageStatus.error:
        updateSentMessageByMuidImpl(ctx, message);
        break;
    }
  }
}

export function updateSentMessageByMuidImpl(ctx: any, message: CometChat.BaseMessage): void {
  const muid = message.getMuid?.();
  if (!muid) {
    const messageId = message.getId();
    if (messageId) { ctx.updateMessageById(messageId, message); }
    return;
  }
  const existingMessage = ctx.messageMuidMap.get(muid);
  if (existingMessage) {
    ctx.updateMessageByMuid(muid, message);
  } else {
    const messageId = message.getId();
    if (messageId) { ctx.updateMessageById(messageId, message); }
  }
}

export function updateSentMessageReplyCountImpl(ctx: any, message: CometChat.BaseMessage): void {
  const parentId = message.getParentMessageId();
  if (!parentId) { return; }
  const parentMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(parentId));
  if (!parentMessage) { return; }
  const clonedParent = CometChatUIKitUtility.clone(parentMessage);
  const currentCount = clonedParent.getReplyCount() || 0;
  clonedParent.setReplyCount(currentCount + 1);
  ctx.updateMessageById(parentId, clonedParent);
}

export function handleEditedMessageImpl(ctx: any, message: CometChat.BaseMessage): void {
  if (!ctx.isMessageForCurrentConversation(message)) { return; }
  ctx.updateMessageById(message.getId(), message);
  CometChatMessageEvents.onMessageEdited.next(message);
}
