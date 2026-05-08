/**
 * Typing indicator utilities for CometChatMessageHeader component.
 *
 * Extracted from cometchat-message-header.component.ts to isolate
 * typing text generation and typing user count logic.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ==================== Typing Text ====================

/**
 * Returns the localized typing indicator text for the header subtitle.
 *
 * For 1-on-1 chats: "Typing..."
 * For group chats with 1 typer: "Alice is typing..."
 * For group chats with 2 typers: "Alice, Bob are typing..."
 * For group chats with 3+ typers: "Alice and 2 others are typing..."
 *
 * @param typingUsers - Array of users currently typing
 * @param isGroup - Whether this is a group conversation
 */
export function getTypingText(
  typingUsers: CometChat.User[],
  isGroup: boolean
): string {
  if (typingUsers.length === 0) return '';

  if (!isGroup) {
    return CometChatLocalize.getLocalizedString('message_header_typing');
  }

  if (typingUsers.length === 1) {
    const name = typingUsers[0].getName() || '';
    return `${name} ${CometChatLocalize.getLocalizedString('message_header_is_typing')}`;
  }

  if (typingUsers.length === 2) {
    const names = typingUsers.map(u => u.getName() || '').join(', ');
    return `${names} ${CometChatLocalize.getLocalizedString('message_header_are_typing')}`;
  }

  // 3+ typers
  const firstName = typingUsers[0].getName() || '';
  const othersCount = typingUsers.length - 1;
  const othersText = othersCount === 1
    ? CometChatLocalize.getLocalizedString('message_header_and_one_other')
    : CometChatLocalize.getLocalizedString('message_header_and_n_others').replace(
        '{count}',
        othersCount.toString()
      );
  return `${firstName} ${othersText} ${CometChatLocalize.getLocalizedString('message_header_are_typing')}`;
}

/**
 * Returns the number of users currently typing.
 */
export function getTypingUsersCount(typingUsers: CometChat.User[]): number {
  return typingUsers.length;
}

// ==================== Member Count Text ====================

/**
 * Returns the localized member count text for a group header.
 * e.g. "5 Members" or "1 Member"
 */
export function getHeaderMemberCountText(memberCount: number): string {
  if (memberCount <= 0) return '';
  const key = memberCount === 1 ? 'group_member' : 'group_members';
  return `${memberCount} ${CometChatLocalize.getLocalizedString(key)}`;
}

// ==================== User Status ====================

/**
 * Checks whether the user is currently online.
 */
export function isUserOnlineStatus(
  user: CometChat.User | null,
  userStatus: string | null
): boolean {
  if (!user) return false;
  const status = userStatus ?? user.getStatus();
  return status === CometChat.USER_STATUS.ONLINE;
}

/**
 * Returns the last active timestamp for a user (null if online).
 */
export function getUserLastActiveTimestamp(
  user: CometChat.User | null,
  userStatus: string | null
): number | null {
  if (!user) return null;
  const status = userStatus ?? user.getStatus();
  if (status === CometChat.USER_STATUS.ONLINE) return null;
  return user.getLastActiveAt() ?? null;
}
