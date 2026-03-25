import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Result interface for CometChatUIKit.init() method.
 * Represents the initialization result containing the logged-in user if available.
 */
export interface InitResult {
  /**
   * The logged-in user if a user was already authenticated during initialization,
   * or null if no user is currently logged in.
   */
  user: CometChat.User | null;
}

/**
 * Result interface for CometChatUIKit.logout() method.
 * Represents the logout result containing a success message.
 */
export interface LogoutResult {
  /**
   * Success message returned by the CometChat SDK after logout.
   */
  message: string;
}


