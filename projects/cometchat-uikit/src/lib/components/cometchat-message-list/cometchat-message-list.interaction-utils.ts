import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {CometChatUIEvents} from '../../events/CometChatUIEvents';
import {CometChatConversationEvents} from '../../events/CometChatConversationEvents';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatUIKitConstants} from '../../constants';
import {MessageStatus} from '../../Enums/Enums';
import {ToastType} from '../base-elements/cometchat-toast/cometchat-toast.component';

export function onEditMessageImpl(self: any, messageId: number): void {
  const message = self.messages().find((m: CometChat.BaseMessage) => m.getId() === messageId);
  if (message && message instanceof CometChat.TextMessage) {
    CometChatMessageEvents.ccMessageEdited.next({
      message: message,
      status: MessageStatus.inprogress,
      parentMessageId: self.parentMessageId ?? null,
    });
  }
}

export function onReplyMessageImpl(self: any, messageId: number): void {
  const message = self.messages().find((m: CometChat.BaseMessage) => m.getId() === messageId);
  if (message) {
    CometChatMessageEvents.ccReplyToMessage.next({
      message: message,
      status: MessageStatus.inprogress,
      // ENG-35025: Include parentMessageId so the composer subscription can scope
      // the reply event to the correct composer instance (thread vs main).
      parentMessageId: self.parentMessageId ?? null,
    });
    self.replyClick.emit(message);
  }
}

export function onReplyPreviewClickImpl(self: any, quotedMessage: CometChat.BaseMessage): void {
  const messageId = quotedMessage.getId();
  if (!messageId) return;
  const existingMessage = self.messages().find((m: CometChat.BaseMessage) => m.getId() === messageId);
  if (existingMessage) { self.scrollToMessage(messageId); } else {
    self.messageListService.fetchMessagesAroundId(messageId).then(() => {
      self.cdr.markForCheck();
      self.scrollToMessageWithRetry(messageId, 10);
    }).catch((error: unknown) => {
      CometChatLogger.error('CometChatMessageList', 'Error fetching around quoted message:', error);
    });
  }
}

export function onMessageInfoImpl(self: any, messageId: number): void {
  const message = self.messages().find((m: CometChat.BaseMessage) => m.getId() === messageId);
  if (message) { self.messageForInfo.set(message); self.showMessageInfo.set(true); }
}

export function closeMessageInfoImpl(self: any): void {
  self.showMessageInfo.set(false);
  self.messageForInfo.set(null);
}

export async function copyMessageToClipboardImpl(self: any, message: CometChat.BaseMessage): Promise<void> {
  if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) { return; }
  try {
    const textMessage = message as CometChat.TextMessage;
    const rawText = textMessage.getText();
    if (!rawText) { return; }

    // Replace SDK mention patterns with display names before copying.
    // <@uid:superhero1> → @DisplayName, <@all:label> → @label
    const mentionedUsers: CometChat.User[] = textMessage.getMentionedUsers?.() || [];
    const userMap = new Map<string, string>();
    mentionedUsers.forEach(u => userMap.set(u.getUid(), u.getName()));

    const text = rawText
      // Replace user mentions: <@uid:superhero1> → @DisplayName (or @uid as fallback)
      .replace(/<@uid:(.*?)>/g, (_match, uid) => `@${userMap.get(uid) ?? uid}`)
      // Replace channel mentions: <@all:all> → @all
      .replace(/<@all:(.*?)>/g, (_match, label) => `@${label || 'all'}`);

    await navigator.clipboard.writeText(text);
    self.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_copied'));
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error copying message to clipboard:', error);
    self.showInlineToast(CometChatLocalize.getLocalizedString('message_copy_error'), ToastType.error, 3000);
  }
}

export function handleMessagePrivatelyImpl(self: any, message: CometChat.BaseMessage): void {
  if (!self.group) { return; }
  const sender = message.getSender();
  if (!sender || (self.loggedInUser && sender.getUid() === self.loggedInUser.getUid())) { return; }
  CometChatUIEvents.ccOpenChat.next({ user: sender });
  self.messagePrivatelyClick.emit({ message, user: sender });
}

export async function markMessageAsUnreadImpl(self: any, message: CometChat.BaseMessage): Promise<void> {
  const messageId = message.getId();
  if (self.lastUnreadMarkedMessageId() === messageId) { return; }
  try {
    const updatedConversation = await self.messageListService.markAsUnread(message);
    self.lastUnreadMarkedMessageId.set(messageId);
    self.unreadDividerMessageId.set(messageId);
    const unreadCount = updatedConversation.getUnreadMessageCount() ?? 0;
    if (unreadCount > 0) {
      self.markedAsUnreadCount.set(unreadCount);
      self.showScrollToBottom.set(true);
    }
    CometChatConversationEvents.ccUpdateConversation.next(updatedConversation);
    self.cdr.markForCheck();
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'markMessageAsUnread failed', error);
    self.showInlineToast(
      CometChatLocalize.getLocalizedString('something_went_wrong'),
      ToastType.error
    );
  }
}
