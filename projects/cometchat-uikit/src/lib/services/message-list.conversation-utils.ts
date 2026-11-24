import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../constants';
import {CometChatUIKit} from '../cometchat-uikit';
import {CometChatLogger} from '../utils/CometChatLogger';
import {isOfflineOn} from '../utils/offline/offline-gate';

export function isMessageForCurrentConversationImpl(self: any, message: CometChat.BaseMessage): boolean {
  if (!self.currentUser && !self.currentGroup) { return false; }
  const receiverType = message.getReceiverType();
  if (self.currentUser) {
    if (receiverType !== CometChatUIKitConstants.MessageReceiverType.user) return false;
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) return false;
    const loggedInUserId = loggedInUser.getUid();
    const currentUserId = self.currentUser.getUid();
    const sender = message.getSender();
    const senderId = sender ? sender.getUid() : '';
    const receiverId = message.getReceiverId();
    const sentByLoggedInUser = (!sender || senderId === loggedInUserId) && receiverId === currentUserId;
    const sentByCurrentUser = (!sender || senderId === currentUserId) && receiverId === loggedInUserId;
    if (!sentByLoggedInUser && !sentByCurrentUser) return false;
  }
  if (self.currentGroup) {
    if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) return false;
    const receiver = message.getReceiverId();
    if (receiver != self.currentGroup.getGuid()) return false;
  }
  if (self.parentMessageId !== null) {
    const messageParentId = message.getParentMessageId();
    if (messageParentId !== self.parentMessageId) return false;
  } else {
    if (message.getParentMessageId() && !self.isAgentChatMode) return false;
  }
  return true;
}

export function isThreadReplyForCurrentConversationImpl(self: any, message: CometChat.BaseMessage): boolean {
  if (!self.currentUser && !self.currentGroup) { return false; }
  const receiverId = message.getReceiverId();
  const senderId = message.getSender()?.getUid() || '';
  if (self.currentUser) {
    if (message.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.user) return false;
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) return false;
    const loggedInUserId = loggedInUser.getUid();
    const currentUserId = self.currentUser.getUid();
    return (
      (senderId === loggedInUserId && receiverId === currentUserId) ||
      (senderId === currentUserId && receiverId === loggedInUserId)
    );
  }
  if (self.currentGroup) {
    if (message.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.group) return false;
    return receiverId === self.currentGroup.getGuid();
  }
  return false;
}

export function handleGroupActionImpl(self: any, message: CometChat.Action, group: CometChat.Group): void {
  if (!self.currentGroup) return;
  if (group.getGuid() !== self.currentGroup.getGuid()) return;
  if (self.hideGroupActionMessages) return;
  self.addMessage(message);
}

export function handleCallActionImpl(self: any, call: CometChat.Call): void {
  if (!self.currentUser && !self.currentGroup) return;
  const receiverType = call.getReceiverType();
  const receiver = call.getReceiver();
  const sender = call.getSender();
  if (self.currentUser) {
    const currentUid = self.currentUser.getUid();
    const receiverUid = receiverType === CometChatUIKitConstants.MessageReceiverType.user ? (receiver as CometChat.User)?.getUid?.() : null;
    const senderUid = sender?.getUid?.();
    if (receiverUid !== currentUid && senderUid !== currentUid) return;
  } else if (self.currentGroup) {
    if (receiverType !== CometChatUIKitConstants.MessageReceiverType.group) return;
    if ((receiver as CometChat.Group)?.getGuid?.() !== self.currentGroup.getGuid()) return;
  }
  const existing = self.getMessageById(call.getId());
  if (existing) { self.updateMessageById(call.getId(), call); } else { self.addMessage(call); }
}

export async function handleReconnectionImpl(self: any): Promise<void> {
  try {
    if (!self.currentUser && !self.currentGroup) { return; }
    // With offline on the SDK's reconnect sweep catches the chat up; the list
    // consumes it through the offline hub and makes no fetch of its own.
    if (isOfflineOn()) {
      // A "Connect to load more" footer now loads on scroll as well as on tap
      // (UIK-READ-03); nothing is fetched until the user asks.
      self.markOfflineConnected?.();
      // The error view is up because the device was offline: the first page is read once now (D83).
      await self.reloadAfterOfflineError?.();
      return;
    }
    // Kill switch (UIK-LIFE-03): offline was switched off under un-acked rows
    // this list drew on the offline path; they turn failed (direct).
    self.checkKillSwitch?.();
    const lastMessageId = self.nextMessageIdSignal();
    if (lastMessageId === 0) {
      // Nothing was ever loaded because the first fetch failed: load the first page
      // now. A chat that loaded fine and is simply empty makes no request (as today).
      if (self.allMessagesSignal().length === 0 && self.errorStateSignal() !== null) {
        self.errorStateSignal.set(null);
        self.messagesRequest = self.buildMessagesRequest();
        await self.fetchPreviousMessages();
      }
      return;
    }
    self.nextMessagesRequest = self.buildNextMessagesRequest(lastMessageId);
    await self.fetchNextMessages();
  } catch (error) {
    CometChatLogger.error('MessageListService', 'Error handling reconnection:', error);
  }
}
