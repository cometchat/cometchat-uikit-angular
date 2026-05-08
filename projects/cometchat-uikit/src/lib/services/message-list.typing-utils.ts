import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKit} from '../cometchat-uikit';
import {CometChatUIKitConstants} from '../constants';
import {CometChatLogger} from '../utils/CometChatLogger';

export function handleTypingStartedImpl(ctx: any, indicator: CometChat.TypingIndicator): void {
  try {
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) { return; }
    const sender = indicator.getSender();
    if (!sender) { return; }
    const senderUid = sender.getUid();
    if (senderUid === loggedInUser.getUid()) { return; }
    if (!isTypingIndicatorForCurrentConversationImpl(ctx, indicator)) { return; }
    const existingTimeout = ctx.typingTimeoutsMap.get(senderUid);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      ctx.typingTimeoutsMap.delete(senderUid);
    }
    const currentTypingUsers = new Map(ctx.typingUsersSignal());
    currentTypingUsers.set(senderUid, indicator);
    ctx.typingUsersSignal.set(currentTypingUsers);
    const timeoutId = setTimeout(() => {
      clearTypingIndicatorImpl(ctx, senderUid);
    }, ctx.TYPING_INDICATOR_TIMEOUT);
    ctx.typingTimeoutsMap.set(senderUid, timeoutId);
  } catch (error) {
    CometChatLogger.error('MessageListService', 'Error handling typing started:', error);
  }
}

export function handleTypingEndedImpl(ctx: any, indicator: CometChat.TypingIndicator): void {
  try {
    const sender = indicator.getSender();
    if (!sender) { return; }
    const senderUid = sender.getUid();
    clearTypingIndicatorImpl(ctx, senderUid);
  } catch (error) {
    CometChatLogger.error('MessageListService', 'Error handling typing ended:', error);
  }
}

export function clearTypingIndicatorImpl(ctx: any, userUid: string): void {
  const existingTimeout = ctx.typingTimeoutsMap.get(userUid);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    ctx.typingTimeoutsMap.delete(userUid);
  }
  const currentTypingUsers = new Map(ctx.typingUsersSignal());
  if (currentTypingUsers.has(userUid)) {
    currentTypingUsers.delete(userUid);
    ctx.typingUsersSignal.set(currentTypingUsers);
  }
}

export function isTypingIndicatorForCurrentConversationImpl(ctx: any, indicator: CometChat.TypingIndicator): boolean {
  if (!ctx.currentUser && !ctx.currentGroup) { return false; }
  const receiverType = indicator.getReceiverType();
  const receiverId = indicator.getReceiverId();
  if (ctx.currentUser) {
    if (receiverType !== CometChatUIKitConstants.MessageReceiverType.user) return false;
    const sender = indicator.getSender();
    if (!sender) return false;
    if (sender.getUid() !== ctx.currentUser.getUid()) return false;
  }
  if (ctx.currentGroup) {
    if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) return false;
    if (receiverId !== ctx.currentGroup.getGuid()) return false;
  }
  return true;
}
