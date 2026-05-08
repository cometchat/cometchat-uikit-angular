import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatSoundManager} from '../../resources/CometChatSoundManager/CometChatSoundManager';
import {CometChatLogger} from '../../utils/CometChatLogger';

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

export function computeMessagesWithDateSeparatorsImpl(ctx: any): any[] {
  const messages = ctx.messages();
  const idCounts = new Map<number, number>();
  for (const msg of messages) {
    const id = msg.getId();
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  const duplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    console.warn('[MessageList] DUPLICATE message IDs in messages array:', duplicates, 'total messages:', messages.length);
  }
  if (messages.length === 0 || ctx.hideDateSeparator) {
    return messages.map((msg: CometChat.BaseMessage) => ({
      type: 'message' as const,
      message: msg,
      key: `msg-${msg.getId() || msg.getMuid()}-rc${msg.getReplyCount() || 0}-r${msg.getReadAt() || 0}-d${msg.getDeliveredAt() || 0}-del${msg.getDeletedAt() || 0}-e${msg.getEditedAt() || 0}`,
    }));
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
    result.push({
      type: 'message',
      message,
      key: `msg-${message.getId() || message.getMuid()}-rc${message.getReplyCount() || 0}-r${message.getReadAt() || 0}-d${message.getDeliveredAt() || 0}-del${message.getDeletedAt() || 0}-e${message.getEditedAt() || 0}`,
    });
  }
  return result;
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
