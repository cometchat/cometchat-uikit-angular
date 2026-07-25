import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatSoundManager} from '../../resources/CometChatSoundManager/CometChatSoundManager';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {getBatchId} from '../../utils/message-metadata-utils';

export function handleNewMessagesImpl(ctx: any, currentMessages: CometChat.BaseMessage[]): void {
  if (currentMessages.length === 0 || ctx.previousMessages.length === 0) {
    if (currentMessages.length > 0 && ctx.previousMessages.length === 0) {
      ctx.hideConversationStarters.set(true);
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (
        lastMessage &&
        ctx.isReceiverMessage(lastMessage) &&
        ctx.shouldShowSmartRepliesForMessage(lastMessage)
      ) {
        ctx.lastReceivedMessage.set(lastMessage);
        ctx.hideSmartReplies.set(false);
      }
    }
    return;
  }
  const latestMessage = currentMessages[currentMessages.length - 1];
  const previousLatest = ctx.previousMessages[ctx.previousMessages.length - 1];
  if (latestMessage.getId() !== previousLatest?.getId()) {
    ctx.hideConversationStarters.set(true);
    const sender = latestMessage.getSender();
    const isOwnMessage = ctx.loggedInUser && sender?.getUid() === ctx.loggedInUser.getUid();
    if (!isOwnMessage) {
      ctx.lastReceivedMessage.set(latestMessage);
      if (ctx.shouldShowSmartRepliesForMessage(latestMessage)) {
        ctx.hideSmartReplies.set(false);
      } else {
        ctx.hideSmartReplies.set(true);
      }
      ctx.handleRealtimeMessageReceipt(latestMessage);
      const senderName = sender?.getName() || CometChatLocalize.getLocalizedString('unknown');
      const preview = ctx.getMessagePreview(latestMessage);
      ctx.announceNewMessage(senderName, preview);
      if (!ctx.isAtBottom()) {
        ctx.newMessagesCount.update((count: number) => count + 1);
        ctx.showNewMessagesBanner.set(true);
        // Update the conversation list unread count when the user is scrolled up
        // and not reading the latest messages.
        const conversationId = ctx.getConversationId?.();
        if (conversationId) {
          const currentCount = ctx.conversationsService?.findConversation?.(
            ctx.user?.getUid?.() || ctx.group?.getGuid?.()
          )?.getUnreadMessageCount?.() ?? 0;
          ctx.conversationsService?.updateConversationUnreadCount?.(
            ctx.user?.getUid?.() || ctx.group?.getGuid?.(),
            currentCount + 1
          );
        }
      }
    }
    if (ctx.shouldPlaySound(latestMessage)) { ctx.playMessageSound(); }
    if (isOwnMessage) {
      setTimeout(() => ctx.scrollToBottom(), 0);
    } else if (ctx.scrollToBottomOnNewMessages && ctx.isAtBottom()) {
      setTimeout(() => ctx.scrollToBottom(), 0);
    }
  }
}

export function shouldPlaySoundImpl(ctx: any, message: CometChat.BaseMessage): boolean {
  if (ctx.effectiveDisableSoundForMessages()) { return false; }
  const sender = message.getSender();
  if (ctx.loggedInUser && sender?.getUid() === ctx.loggedInUser.getUid()) { return false; }
  if (Date.now() - ctx.lastSoundPlayedAt < ctx.SOUND_THROTTLE_INTERVAL) { return false; }
  return true;
}

export function playMessageSoundImpl(ctx: any): void {
  try {
    ctx.lastSoundPlayedAt = Date.now();
    CometChatSoundManager.play('incomingMessage', ctx.effectiveCustomSoundForMessages() || null);
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error playing sound:', error);
  }
}

/**
 * Stable @for track key for a message row. It intentionally keys ONLY on a durable identity —
 * muid first (the client-assigned id that a sent message keeps from its optimistic state through
 * server confirmation), falling back to the server id for messages we never sent optimistically.
 *
 * It must NOT embed volatile fields (readAt/deliveredAt/editedAt/batch position). Every receipt,
 * confirmation, and edit already replaces the message with a fresh object reference and re-renders
 * the bubble through its OnPush @Input bindings — so baking those into the key adds nothing except a
 * changed key, which makes Angular destroy and rebuild the whole bubble subtree. That recreation
 * silently discards transient in-bubble UI state (an open fullscreen viewer, an expanded audio/file
 * list, an open options menu) the instant a receipt lands.
 */
function messageTrackKey(message: CometChat.BaseMessage): string {
  return `msg-${message.getMuid?.() || message.getId()}`;
}

export function computeMessagesWithDateSeparatorsImpl(ctx: any): any[] {
  const messages = ctx.messages();
  const idCounts = new Map<number, number>();
  for (const msg of messages) {
    const id = msg.getId();
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  const duplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    CometChatLogger.warn('CometChatMessageList', 'DUPLICATE message IDs in messages array:', duplicates, 'total messages:', messages.length);
  }
  // Batch grouping (multi-attachment): consecutive messages sharing metadata.batchId.
  const batchFlags = computeBatchFlagsImpl(messages);
  if (messages.length === 0 || ctx.hideDateSeparator) {
    return messages.map((msg: CometChat.BaseMessage) => {
      const bf = batchFlags.get(msg);
      const isFirstInBatch = bf?.isFirstInBatch ?? true;
      const isLastInBatch = bf?.isLastInBatch ?? true;
      return {
        type: 'message' as const,
        message: msg,
        isFirstInBatch,
        isLastInBatch,
        key: messageTrackKey(msg),
      };
    });
  }
  const result: any[] = [];
  let lastDate: string | null = null;
  for (const message of messages) {
    const messageDate = getDateStringImpl(message.getSentAt());
    if (message?.getId() && messageDate !== lastDate) {
      result.push({
        type: 'date-separator',
        date: message.getSentAt(),
        key: `sep-${messageDate}`,
      });
      lastDate = messageDate;
    }
    const bf = batchFlags.get(message);
    const isFirstInBatch = bf?.isFirstInBatch ?? true;
    const isLastInBatch = bf?.isLastInBatch ?? true;
    result.push({
      type: 'message',
      message,
      isFirstInBatch,
      isLastInBatch,
      key: messageTrackKey(message),
    });
  }
  return result;
}

/** Read the composer-set `metadata.batchId` from a message (or null). */
export function getBatchIdImpl(message: CometChat.BaseMessage): string | null {
  return getBatchId(message);
}

/**
 * First/last-in-batch flags. A batch is a run of CONSECUTIVE messages sharing the
 * same `metadata.batchId`. Messages without a batchId are their own group
 * (isFirstInBatch = isLastInBatch = true). Exported for tests.
 */
export function computeBatchFlagsImpl(
  messages: CometChat.BaseMessage[],
): Map<CometChat.BaseMessage, { isFirstInBatch: boolean; isLastInBatch: boolean }> {
  const flags = new Map<CometChat.BaseMessage, { isFirstInBatch: boolean; isLastInBatch: boolean }>();
  for (let i = 0; i < messages.length; i++) {
    const batchId = getBatchIdImpl(messages[i]);
    if (!batchId) {
      flags.set(messages[i], { isFirstInBatch: true, isLastInBatch: true });
      continue;
    }
    const prev = i > 0 ? getBatchIdImpl(messages[i - 1]) : null;
    const next = i < messages.length - 1 ? getBatchIdImpl(messages[i + 1]) : null;
    flags.set(messages[i], {
      isFirstInBatch: batchId !== prev,
      isLastInBatch: batchId !== next,
    });
  }
  return flags;
}

export function getReactionFingerprintImpl(message: CometChat.BaseMessage): string {
  const reactions = message.getReactions?.();
  if (!reactions || reactions.length === 0) return '0';
  return reactions
    .map((r: CometChat.ReactionCount) => `${r.getReaction()}${r.getCount()}${r.getReactedByMe() ? 'm' : ''}`)
    .join('|');
}

export function getDateStringImpl(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
