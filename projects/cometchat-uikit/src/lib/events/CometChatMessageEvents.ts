import { DestroyRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageStatus } from '../Enums/Enums';
import { Subject, Subscription } from 'rxjs';
import { subscribeWithOptionalCleanup } from './event-utils';
import { IMessages } from './CometChatMessageEvents.types';

export type { IMessages };

/**
 * Message event subjects for handling actions related to messages (e.g., message sent, edited, deleted, etc.)
 */

export class CometChatMessageEvents {
  // ── UI-level Subjects ──
  static ccMessageSent: Subject<IMessages> = new Subject<IMessages>();
  static ccMessageEdited: Subject<IMessages> = new Subject<IMessages>();
  static ccReplyToMessage: Subject<IMessages> = new Subject<IMessages>();
  static ccMessageTranslated: Subject<IMessages> = new Subject<IMessages>();
  /**
   * Event for message read in message list.
   * Emitted when a message is marked as read.
   * @see Requirement 9.1 - Notify conversations component when messages are read
   */
  static ccMessageRead: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
  static ccMessageDeleted: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();

  // ── SDK-wrapper Subjects ──
  static onTextMessageReceived: Subject<CometChat.TextMessage> =
    new Subject<CometChat.TextMessage>();
  static onMessageModerated: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
  static onMediaMessageReceived: Subject<CometChat.MediaMessage> =
    new Subject<CometChat.MediaMessage>();
  static onCustomMessageReceived: Subject<CometChat.CustomMessage> =
    new Subject<CometChat.CustomMessage>();
  static onTypingStarted: Subject<CometChat.TypingIndicator> =
    new Subject<CometChat.TypingIndicator>();
  static onTypingEnded: Subject<CometChat.TypingIndicator> =
    new Subject<CometChat.TypingIndicator>();
  static onMessagesDelivered: Subject<CometChat.MessageReceipt> =
    new Subject<CometChat.MessageReceipt>();
  static onMessagesRead: Subject<CometChat.MessageReceipt> =
    new Subject<CometChat.MessageReceipt>();
  static onMessagesDeliveredToAll: Subject<CometChat.MessageReceipt> =
    new Subject<CometChat.MessageReceipt>();
  static onMessagesReadByAll: Subject<CometChat.MessageReceipt> =
    new Subject<CometChat.MessageReceipt>();
  static onMessageEdited: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
  static onMessageDeleted: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
  static onMessageReactionAdded: Subject<CometChat.ReactionEvent> =
    new Subject<CometChat.ReactionEvent>();
  static onMessageReactionRemoved: Subject<CometChat.ReactionEvent> =
    new Subject<CometChat.ReactionEvent>();
  static onCustomInteractiveMessageReceived: Subject<CometChat.InteractiveMessage> =
    new Subject<CometChat.InteractiveMessage>();
  static onFormMessageReceived: Subject<CometChat.InteractiveMessage> =
    new Subject<CometChat.InteractiveMessage>();
  static onCardMessageReceived: Subject<CometChat.InteractiveMessage> =
    new Subject<CometChat.InteractiveMessage>();
  static onSchedulerMessageReceived: Subject<CometChat.InteractiveMessage> =
    new Subject<CometChat.InteractiveMessage>();
  static onAIAssistantMessageReceived: Subject<CometChat.AIAssistantMessage> =
    new Subject<CometChat.AIAssistantMessage>();
  static onAIToolResultReceived: Subject<CometChat.AIToolResultMessage> =
    new Subject<CometChat.AIToolResultMessage>();
  static onAIToolArgumentsReceived: Subject<CometChat.AIToolArgumentMessage> =
    new Subject<CometChat.AIToolArgumentMessage>();

  // ── Deprecated generic method ──

  /** @deprecated Use typed publish methods instead (e.g., publishMessageSent). */
  static publishEvent(event: Subject<unknown>, item: unknown = null) {
    event.next(item);
  }

  // ── Typed Publish Methods (UI-level) ──

  static publishMessageSent(data: IMessages): void {
    CometChatMessageEvents.ccMessageSent.next(data);
  }

  static publishMessageEdited(data: IMessages): void {
    CometChatMessageEvents.ccMessageEdited.next(data);
  }

  static publishReplyToMessage(data: IMessages): void {
    CometChatMessageEvents.ccReplyToMessage.next(data);
  }

  static publishMessageTranslated(data: IMessages): void {
    CometChatMessageEvents.ccMessageTranslated.next(data);
  }

  static publishMessageRead(message: CometChat.BaseMessage): void {
    CometChatMessageEvents.ccMessageRead.next(message);
  }

  static publishMessageDeleted(message: CometChat.BaseMessage): void {
    CometChatMessageEvents.ccMessageDeleted.next(message);
  }

  // ── Typed Publish Methods (SDK-wrapper) ──

  static publishTextMessageReceived(message: CometChat.TextMessage): void {
    CometChatMessageEvents.onTextMessageReceived.next(message);
  }

  static publishMediaMessageReceived(message: CometChat.MediaMessage): void {
    CometChatMessageEvents.onMediaMessageReceived.next(message);
  }

  static publishCustomMessageReceived(message: CometChat.CustomMessage): void {
    CometChatMessageEvents.onCustomMessageReceived.next(message);
  }

  static publishTypingStarted(indicator: CometChat.TypingIndicator): void {
    CometChatMessageEvents.onTypingStarted.next(indicator);
  }

  static publishTypingEnded(indicator: CometChat.TypingIndicator): void {
    CometChatMessageEvents.onTypingEnded.next(indicator);
  }

  static publishMessagesDelivered(receipt: CometChat.MessageReceipt): void {
    CometChatMessageEvents.onMessagesDelivered.next(receipt);
  }

  static publishMessagesRead(receipt: CometChat.MessageReceipt): void {
    CometChatMessageEvents.onMessagesRead.next(receipt);
  }

  static publishMessagesDeliveredToAll(receipt: CometChat.MessageReceipt): void {
    CometChatMessageEvents.onMessagesDeliveredToAll.next(receipt);
  }

  static publishMessagesReadByAll(receipt: CometChat.MessageReceipt): void {
    CometChatMessageEvents.onMessagesReadByAll.next(receipt);
  }

  static publishMessageModerated(message: CometChat.BaseMessage): void {
    CometChatMessageEvents.onMessageModerated.next(message);
  }

  static publishOnMessageEdited(message: CometChat.BaseMessage): void {
    CometChatMessageEvents.onMessageEdited.next(message);
  }

  static publishOnMessageDeleted(message: CometChat.BaseMessage): void {
    CometChatMessageEvents.onMessageDeleted.next(message);
  }

  static publishMessageReactionAdded(event: CometChat.ReactionEvent): void {
    CometChatMessageEvents.onMessageReactionAdded.next(event);
  }

  static publishMessageReactionRemoved(event: CometChat.ReactionEvent): void {
    CometChatMessageEvents.onMessageReactionRemoved.next(event);
  }

  static publishCustomInteractiveMessageReceived(message: CometChat.InteractiveMessage): void {
    CometChatMessageEvents.onCustomInteractiveMessageReceived.next(message);
  }

  static publishFormMessageReceived(message: CometChat.InteractiveMessage): void {
    CometChatMessageEvents.onFormMessageReceived.next(message);
  }

  static publishCardMessageReceived(message: CometChat.InteractiveMessage): void {
    CometChatMessageEvents.onCardMessageReceived.next(message);
  }

  static publishSchedulerMessageReceived(message: CometChat.InteractiveMessage): void {
    CometChatMessageEvents.onSchedulerMessageReceived.next(message);
  }

  static publishAIAssistantMessageReceived(message: CometChat.AIAssistantMessage): void {
    CometChatMessageEvents.onAIAssistantMessageReceived.next(message);
  }

  static publishAIToolResultReceived(message: CometChat.AIToolResultMessage): void {
    CometChatMessageEvents.onAIToolResultReceived.next(message);
  }

  static publishAIToolArgumentsReceived(message: CometChat.AIToolArgumentMessage): void {
    CometChatMessageEvents.onAIToolArgumentsReceived.next(message);
  }

  // ── Typed Subscribe Helpers (UI-level) ──

  static onMessageSent(cb: (data: IMessages) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccMessageSent, cb, destroyRef);
  }

  static onCcMessageEdited(cb: (data: IMessages) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccMessageEdited, cb, destroyRef);
  }

  static onReplyToMessage(cb: (data: IMessages) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccReplyToMessage, cb, destroyRef);
  }

  static onMessageTranslated(cb: (data: IMessages) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccMessageTranslated, cb, destroyRef);
  }

  static onCcMessageRead(
    cb: (data: CometChat.BaseMessage) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccMessageRead, cb, destroyRef);
  }

  static onCcMessageDeleted(
    cb: (data: CometChat.BaseMessage) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.ccMessageDeleted, cb, destroyRef);
  }

  // ── Typed Subscribe Helpers (SDK-wrapper) ──

  static subscribeOnTextMessageReceived(cb: (data: CometChat.TextMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onTextMessageReceived, cb, destroyRef);
  }

  static subscribeOnMediaMessageReceived(cb: (data: CometChat.MediaMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMediaMessageReceived, cb, destroyRef);
  }

  static subscribeOnCustomMessageReceived(cb: (data: CometChat.CustomMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onCustomMessageReceived, cb, destroyRef);
      destroyRef
    
  }

  static subscribeOnTypingStarted(
    cb: (data: CometChat.TypingIndicator) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onTypingStarted, cb, destroyRef);
  }

  static subscribeOnTypingEnded(cb: (data: CometChat.TypingIndicator) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onTypingEnded, cb, destroyRef);
  }

  static subscribeOnMessagesDelivered(cb: (data: CometChat.MessageReceipt) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessagesDelivered, cb, destroyRef);
  }

  static subscribeOnMessagesRead(cb: (data: CometChat.MessageReceipt) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessagesRead, cb, destroyRef);
  }

  static subscribeOnMessagesDeliveredToAll(cb: (data: CometChat.MessageReceipt) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessagesDeliveredToAll, cb, destroyRef);
  }

  static subscribeOnMessagesReadByAll(cb: (data: CometChat.MessageReceipt) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessagesReadByAll, cb, destroyRef);
  }

  static subscribeOnMessageModerated(cb: (data: CometChat.BaseMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessageModerated, cb, destroyRef);
  }

  static subscribeOnMessageEdited(cb: (data: CometChat.BaseMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessageEdited, cb, destroyRef);
  }

  static subscribeOnMessageDeleted(cb: (data: CometChat.BaseMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessageDeleted, cb, destroyRef);
  }

  static subscribeOnMessageReactionAdded(cb: (data: CometChat.ReactionEvent) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessageReactionAdded, cb, destroyRef);
  }

  static subscribeOnMessageReactionRemoved(cb: (data: CometChat.ReactionEvent) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onMessageReactionRemoved, cb, destroyRef);
  }

  static subscribeOnCustomInteractiveMessageReceived(cb: (data: CometChat.InteractiveMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onCustomInteractiveMessageReceived, cb, destroyRef);
  }

  static subscribeOnFormMessageReceived(cb: (data: CometChat.InteractiveMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onFormMessageReceived, cb, destroyRef);
  }

  static subscribeOnCardMessageReceived(cb: (data: CometChat.InteractiveMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onCardMessageReceived, cb, destroyRef);
  }

  static subscribeOnSchedulerMessageReceived(cb: (data: CometChat.InteractiveMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onSchedulerMessageReceived, cb, destroyRef);
  }

  static subscribeOnAIAssistantMessageReceived(cb: (data: CometChat.AIAssistantMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onAIAssistantMessageReceived, cb, destroyRef);
  }

  static subscribeOnAIToolResultReceived(cb: (data: CometChat.AIToolResultMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onAIToolResultReceived, cb, destroyRef);
  }

  static subscribeOnAIToolArgumentsReceived(cb: (data: CometChat.AIToolArgumentMessage) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatMessageEvents.onAIToolArgumentsReceived, cb, destroyRef);
  }
}
