import { Injectable } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * UserService
 *
 * Wraps CometChat SDK user operations (block/unblock).
 * Calling components handle their own feedback.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  /** Block a user by UID. */
  async blockUser(uid: string): Promise<void> {
    await CometChat.blockUsers([uid]);
  }

  /** Unblock a user by UID. */
  async unblockUser(uid: string): Promise<void> {
    await CometChat.unblockUsers([uid]);
  }
}
