/**
 * Accessibility helpers for CometChatMessageHeader component.
 *
 * Pure functions for computing ARIA labels and managing screen reader announcements.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Gets the ARIA label for the header container.
 */
export function getHeaderAriaLabel(
  name: string,
  user: CometChat.User | null,
  group: CometChat.Group | null,
  userStatus: string | null,
  memberCount: number
): string {
  if (user) {
    const status = userStatus || user.getStatus();
    const statusText = status === 'online'
      ? CometChatLocalize.getLocalizedString('message_header_status_online')
      : CometChatLocalize.getLocalizedString('message_header_status_offline');
    return `${name}, ${statusText}`;
  }

  if (group) {
    const membersText = memberCount === 1
      ? CometChatLocalize.getLocalizedString('message_header_member')
      : CometChatLocalize.getLocalizedString('message_header_members');
    return `${name}, ${memberCount} ${membersText}`;
  }

  return CometChatLocalize.getLocalizedString('message_header_back');
}

/**
 * Gets the ARIA label for the clickable item section.
 */
export function getItemAriaLabel(
  name: string,
  user: CometChat.User | null,
  group: CometChat.Group | null,
  userStatus: string | null,
  memberCount: number
): string {
  if (user) {
    const status = userStatus || user.getStatus();
    const statusText = status === 'online'
      ? CometChatLocalize.getLocalizedString('message_header_status_online')
      : CometChatLocalize.getLocalizedString('message_header_status_offline');
    return `${name}, ${statusText}. ${CometChatLocalize.getLocalizedString('message_header_click_for_details')}`;
  }

  if (group) {
    const membersText = memberCount === 1
      ? CometChatLocalize.getLocalizedString('message_header_member')
      : CometChatLocalize.getLocalizedString('message_header_members');
    return `${name}, ${memberCount} ${membersText}. ${CometChatLocalize.getLocalizedString('message_header_click_for_details')}`;
  }

  return '';
}

/**
 * Announces a user status change to screen readers via a temporary aria-live element.
 *
 * @param userName - The user's display name
 * @param status - The new status ('online' or 'offline')
 * @param pendingTimers - Array to push the cleanup timer into
 */
export function announceStatusChange(
  userName: string,
  status: string,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  const statusText = status === 'online'
    ? CometChatLocalize.getLocalizedString('message_header_user_now_online')
    : CometChatLocalize.getLocalizedString('message_header_user_now_offline');

  const announcement = `${userName} ${statusText}`;

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.className = 'cometchat-sr-only';
  el.textContent = announcement;

  document.body.appendChild(el);

  pendingTimers.push(setTimeout(() => {
    if (document.body.contains(el)) document.body.removeChild(el);
  }, 1000));
}
