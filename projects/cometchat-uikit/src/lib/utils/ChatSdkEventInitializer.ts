import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { CometChatUIKitConstants } from '../constants';

/**
 * Initializes and manages CometChat SDK message listeners.
 *
 * This class attaches SDK-level message listeners and forwards events
 * to the UIKit's RxJS-based event system (CometChatMessageEvents).
 *
 * Listeners are attached after login and detached on logout.
 */
export class ChatSdkEventInitializer {
  private static messageListenerId = `message_listener_${Date.now()}`;

  /**
   * Attaches CometChat SDK message listeners.
   * Called automatically after successful login in CometChatUIKit.
   */
  static attachListeners(): void {
    CometChat.addMessageListener(this.messageListenerId, this.getMessageListenerObject());
  }

  /**
   * Detaches CometChat SDK message listeners.
   * Called automatically on logout in CometChatUIKit.
   */
  static detachListeners(): void {
    CometChat.removeMessageListener(this.messageListenerId);
  }

  /**
   * Creates the message listener object with handlers for all message events.
   * Each handler forwards the event to the corresponding CometChatMessageEvents subject.
   */
  private static getMessageListenerObject(): CometChat.MessageListener {
    return new CometChat.MessageListener({
      onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
        CometChatMessageEvents.onTextMessageReceived.next(textMessage);
      },
      onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
        CometChatMessageEvents.onMediaMessageReceived.next(mediaMessage);
      },
      onMessageModerated: (moderatedMessage: CometChat.BaseMessage) => {
        CometChatMessageEvents.onMessageModerated.next(moderatedMessage);
      },
      onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
        CometChatMessageEvents.onCustomMessageReceived.next(customMessage);
      },
      onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
        CometChatMessageEvents.onTypingStarted.next(typingIndicator);
      },
      onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
        CometChatMessageEvents.onTypingEnded.next(typingIndicator);
      },
      onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatMessageEvents.onMessagesDelivered.next(messageReceipt);
      },
      onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatMessageEvents.onMessagesRead.next(messageReceipt);
      },
      onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatMessageEvents.onMessagesDeliveredToAll.next(messageReceipt);
      },
      onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
        CometChatMessageEvents.onMessagesReadByAll.next(messageReceipt);
      },
      onMessageEdited: (message: CometChat.BaseMessage) => {
        CometChatMessageEvents.onMessageEdited.next(message);
      },
      onMessageDeleted: (message: CometChat.BaseMessage) => {
        CometChatMessageEvents.onMessageDeleted.next(message);
      },
      onMessageReactionAdded: (reaction: CometChat.ReactionEvent) => {
        CometChatMessageEvents.onMessageReactionAdded.next(reaction);
      },
      onMessageReactionRemoved: (reaction: CometChat.ReactionEvent) => {
        CometChatMessageEvents.onMessageReactionRemoved.next(reaction);
      },
      onSchedulerMessageReceived: (message: CometChat.InteractiveMessage) => {
        CometChatMessageEvents.onSchedulerMessageReceived.next(message);
      },
      onInteractiveMessageReceived: (message: CometChat.InteractiveMessage) => {
        switch (message.getType()) {
          case CometChatUIKitConstants.MessageTypes.form:
            CometChatMessageEvents.onFormMessageReceived.next(message);
            break;
          // NOTE: the legacy interactive `card` type (category
          // "interactive") is NOT the new developer card. It flows through the
          // generic interactive channel; `onCardMessageReceived` is now reserved
          // for the new CardMessage (category "card") published below.
          default:
            CometChatMessageEvents.onCustomInteractiveMessageReceived.next(message);
            break;
        }
      },
      // New developer card (category "card"); publish the typed CardMessage.
      onCardMessageReceived: (message: CometChat.CardMessage) => {
        CometChatMessageEvents.onCardMessageReceived.next(message);
      },
      onAIAssistantMessageReceived: (message: CometChat.AIAssistantMessage) => {
        CometChatMessageEvents.onAIAssistantMessageReceived.next(message);
      },
      onAIToolResultReceived: (message: CometChat.AIToolResultMessage) => {
        CometChatMessageEvents.onAIToolResultReceived.next(message);
      },
      onAIToolArgumentsReceived: (message: CometChat.AIToolArgumentMessage) => {
        CometChatMessageEvents.onAIToolArgumentsReceived.next(message);
      },
    });
  }
}
