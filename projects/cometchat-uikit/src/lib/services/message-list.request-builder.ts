import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../constants';

/**
 * Default message types fetched by the MessageList when no custom
 * `messagesRequestBuilder` is supplied. Exported so consumers can derive their
 * own type list (e.g. keep all defaults but drop a single extension):
 *
 *   const types = DEFAULT_MESSAGE_TYPES.filter(t => t !== 'extension_poll');
 */
export const DEFAULT_MESSAGE_TYPES: readonly string[] = [
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
  CometChatUIKitConstants.ExtensionTypes.sticker,
  CometChatUIKitConstants.ExtensionTypes.poll,
  CometChatUIKitConstants.ExtensionTypes.whiteboard,
  CometChatUIKitConstants.ExtensionTypes.document,
  CometChatUIKitConstants.calls.meeting,

];

/**
 * Default message categories fetched by the MessageList when no custom
 * `messagesRequestBuilder` is supplied. Includes the `action` category, which
 * the MessageList omits at runtime when `hideGroupActionMessages` is set.
 */
export const DEFAULT_MESSAGE_CATEGORIES: readonly string[] = [
  CometChatUIKitConstants.MessageCategory.message,
  CometChatUIKitConstants.MessageCategory.custom,
  CometChatUIKitConstants.MessageCategory.call,
  CometChatUIKitConstants.MessageCategory.interactive,
  CometChatUIKitConstants.MessageCategory.agentic,
  CometChatUIKitConstants.MessageCategory.action,
   CometChatUIKitConstants.MessageCategory.card
];

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
  const defaults = [...DEFAULT_MESSAGE_TYPES];
  if (self.customMessageTypes.size > 0) { const merged = new Set(defaults); self.customMessageTypes.forEach((type: string) => merged.add(type)); return Array.from(merged); }
  return defaults;
}

export function getDefaultMessageCategoriesImpl(self: any): string[] {
  if (self.replacedMessageCategories) { return Array.from(self.replacedMessageCategories) as string[]; }
  const categories = self.hideGroupActionMessages
    ? DEFAULT_MESSAGE_CATEGORIES.filter(c => c !== CometChatUIKitConstants.MessageCategory.action)
    : [...DEFAULT_MESSAGE_CATEGORIES];
  if (self.customMessageCategories.size > 0) { const merged = new Set(categories); self.customMessageCategories.forEach((cat: string) => merged.add(cat)); return Array.from(merged); }
  return categories;
}
