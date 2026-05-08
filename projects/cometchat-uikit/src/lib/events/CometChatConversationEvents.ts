import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Conversation event subjects for handling actions related to conversations (e.g., conversation deletion)
 */
export class CometChatConversationEvents {
  static ccConversationDeleted = new Subject<CometChat.Conversation>();

  /**
   * Emitted when a conversation is updated (e.g., after marking a message as unread).
   * Subscribers (e.g., CometChatConversations) should refresh the conversation's unread badge.
   */
  static ccUpdateConversation = new Subject<CometChat.Conversation>();

  // ── Deprecated generic method ──

  /**
   * Publishes a conversation event.
   * @param {Subject<CometChat.Conversation>} event - The event to publish.
   * @param {CometChat.Conversation} conversation - The conversation associated with the event.
   * @deprecated Use publishConversationDeleted() instead.
   */
  static publishEvent(
    event: Subject<CometChat.Conversation>,
    conversation: CometChat.Conversation
  ) {
    event.next(conversation);
  }

  // ── Typed Publish Methods ──

  static publishConversationDeleted(conversation: CometChat.Conversation): void {
    CometChatConversationEvents.ccConversationDeleted.next(conversation);
  }

  // ── Typed Subscribe Helpers ──

  static onConversationDeleted(
    cb: (conversation: CometChat.Conversation) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatConversationEvents.ccConversationDeleted,
      cb,
      destroyRef
    );
  }
}
