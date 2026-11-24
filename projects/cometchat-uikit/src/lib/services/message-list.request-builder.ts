import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../constants';
import {isOfflineOn} from '../utils/offline/offline-gate';
import {serverIdOf} from '../utils/offline/identity';

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

/**
 * A copy of an integrator-supplied builder, so the list's own settings (the
 * conversation, thread scope, anchor id) never leak back into the caller's
 * object or into the next request built from it (D7).
 */
function copyBuilder(builder: CometChat.MessagesRequestBuilder): CometChat.MessagesRequestBuilder {
  try {
    // A real builder (its methods come from the SDK class) carrying the caller's settings.
    return Object.assign(new CometChat.MessagesRequestBuilder(), builder);
  } catch {
    return builder;
  }
}

/**
 * Requests built for the offline path that leave the list's filters to the
 * client: the JS SDK writes a fetched page to its cache only when `hideReplies`
 * is the page's sole content filter (`writeThroughPlan`), so a request with types
 * and categories would never fill the cache and the chat would open empty offline.
 */
const clientFilteredRequests = new WeakSet<object>();

/** Whether the list must filter this request's pages itself. */
export function isClientFiltered(request: unknown): boolean {
  return !!request && clientFilteredRequests.has(request as object);
}

/** The default request of a top-level list, with offline on: no consumer builder, no thread. */
function usesClientFilter(self: any): boolean {
  return !self.messagesRequestBuilder && self.parentMessageId === null && isOfflineOn();
}

/**
 * What the server would have returned for the default types and categories. A
 * row the server has not acked is never hidden by a read (BEH-READ-30).
 */
export function defaultListFilter(self: any): (message: CometChat.BaseMessage) => boolean {
  const types = new Set(getDefaultMessageTypesImpl(self));
  const categories = new Set(getDefaultMessageCategoriesImpl(self));
  return message => serverIdOf(message) === 0 || (types.has(message.getType()) && categories.has(message.getCategory()));
}

/**
 * Whether a swept row would show in this list: its type and category pass the
 * list's own acceptance (an integrator builder's types/categories when set,
 * else the defaults a page load uses). Keeps the server's `action`/`message`
 * records of an edit or delete out of the list (BEH-SYNC-25/31, R82).
 */
export function acceptsSweptRowImpl(self: any, message: CometChat.BaseMessage): boolean {
  const builder = self.messagesRequestBuilder;
  const builderTypes: string[] | undefined = builder?.types;
  const builderCategories: string[] | undefined = builder?.categories;
  const types = builderTypes?.length ? builderTypes : getDefaultMessageTypesImpl(self);
  const categories = builderCategories?.length ? builderCategories : getDefaultMessageCategoriesImpl(self);
  return types.includes(message.getType?.()) && categories.includes(message.getCategory?.());
}

export function buildMessagesRequestImpl(self: any, messageId?: number): CometChat.MessagesRequest {
  let builder: CometChat.MessagesRequestBuilder;
  const clientFilter = usesClientFilter(self);
  if (self.messagesRequestBuilder) { builder = copyBuilder(self.messagesRequestBuilder); } else if (clientFilter) {
    builder = new CometChat.MessagesRequestBuilder().setLimit(self.DEFAULT_MESSAGE_LIMIT);
  } else {
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
  const request = builder.build();
  if (clientFilter) { clientFilteredRequests.add(request); }
  return request;
}

export function buildNextMessagesRequestImpl(self: any, messageId?: number): CometChat.MessagesRequest {
  let builder: CometChat.MessagesRequestBuilder;
  const clientFilter = usesClientFilter(self);
  if (self.messagesRequestBuilder) { builder = copyBuilder(self.messagesRequestBuilder); } else if (clientFilter) {
    builder = new CometChat.MessagesRequestBuilder().setLimit(self.DEFAULT_MESSAGE_LIMIT);
  } else {
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
  const request = builder.build();
  if (clientFilter) { clientFilteredRequests.add(request); }
  return request;
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
