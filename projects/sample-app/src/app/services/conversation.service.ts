import { Injectable } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * ConversationService
 *
 * Wraps CometChat SDK conversation operations.
 * Calling components handle their own feedback.
 */
@Injectable({ providedIn: 'root' })
export class ConversationService {
  /** Delete a conversation. */
  async deleteConversation(conversationWith: string, conversationType: string): Promise<void> {
    await CometChat.deleteConversation(conversationWith, conversationType);
  }
}
