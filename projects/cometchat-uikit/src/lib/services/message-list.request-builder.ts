import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../constants';

export function buildMessagesRequestImpl(self: any, messageId?: number): CometChat.MessagesRequest {
  let builder: CometChat.MessagesRequestBuilder;
  if (self.messagesRequestBuilder) { builder = self.messagesRequestBuilder; } else {
    const messageTypes = getDefaultMessageTypesImpl(self);
    const messageCategories = getDefaultMessageCategoriesImpl(self);
    builder = new CometChat.MessagesRequestBuilder()
      .setLimit(self.DEFAULT_MESSAGE_LIMIT)
      .setTypes(messageTypes)
      .setCategories(messageCategories);
  }
  const isThreadMode = self.parentMessageId !== null;
  builder.hideReplies(!isThreadMode);
  if (self.currentUser) { builder.setUID(self.currentUser.getUid()); } else if (self.currentGroup) { builder.setGUID(self.currentGroup.getGuid()); }
  if (self.parentMessageId !== null) {
    builder.setParentMessageId(self.parentMessageId);
    if (self.isAgentChatMode) { builder.withParent(true); }
  }
  if (messageId !== undefined) { builder.setMessageId(messageId); }
  return builder.build();
}

export function buildNextMessagesRequestImpl(self: any, messageId?: number): CometChat.MessagesRequest {
  let builder: CometChat.MessagesRequestBuilder;
  if (self.messagesRequestBuilder) { builder = self.messagesRequestBuilder; } else {
    const messageTypes = getDefaultMessageTypesImpl(self);
    const messageCategories = getDefaultMessageCategoriesImpl(self);
    builder = new CometChat.MessagesRequestBuilder()
      .setLimit(self.DEFAULT_MESSAGE_LIMIT)
      .setTypes(messageTypes)
      .setCategories(messageCategories);
  }
  const isThreadMode = self.parentMessageId !== null;
  builder.hideReplies(!isThreadMode);
  if (self.currentUser) { builder.setUID(self.currentUser.getUid()); } else if (self.currentGroup) { builder.setGUID(self.currentGroup.getGuid()); }
  if (self.parentMessageId !== null) {
    builder.setParentMessageId(self.parentMessageId);
    if (self.isAgentChatMode) { builder.withParent(true); }
  }
  if (messageId !== undefined) { builder.setMessageId(messageId); }
  return builder.build();
}

export function getDefaultMessageTypesImpl(self: any): string[] {
  if (self.replacedMessageTypes) { return Array.from(self.replacedMessageTypes) as string[]; }
  const defaults = [
    CometChatUIKitConstants.MessageTypes.text,
    CometChatUIKitConstants.MessageTypes.file,
    CometChatUIKitConstants.MessageTypes.image,
    CometChatUIKitConstants.MessageTypes.audio,
    CometChatUIKitConstants.MessageTypes.video,
    CometChatUIKitConstants.MessageTypes.groupMember,
    CometChatUIKitConstants.MessageTypes.form,
    CometChatUIKitConstants.MessageTypes.scheduler,
    CometChatUIKitConstants.MessageTypes.card,
    CometChatUIKitConstants.MessageTypes.assistant,
    'extension_sticker',
    'extension_poll',
    'extension_whiteboard',
    'extension_document',
    'meeting',
  ];
  if (self.customMessageTypes.size > 0) { const merged = new Set(defaults); self.customMessageTypes.forEach((type: string) => merged.add(type)); return Array.from(merged); }
  return defaults;
}

export function getDefaultMessageCategoriesImpl(self: any): string[] {
  if (self.replacedMessageCategories) { return Array.from(self.replacedMessageCategories) as string[]; }
  const categories = [
    CometChatUIKitConstants.MessageCategory.message,
    CometChatUIKitConstants.MessageCategory.custom,
    CometChatUIKitConstants.MessageCategory.call,
    CometChatUIKitConstants.MessageCategory.interactive,
    CometChatUIKitConstants.MessageCategory.agentic,
  ];
  if (!self.hideGroupActionMessages) { categories.push(CometChatUIKitConstants.MessageCategory.action); }
  if (self.customMessageCategories.size > 0) { const merged = new Set(categories); self.customMessageCategories.forEach((cat: string) => merged.add(cat)); return Array.from(merged); }
  return categories;
}
