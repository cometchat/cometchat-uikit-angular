/**
 * Template helper utilities for CometChatMessageHeader component.
 *
 * Pure functions that compute display values from user/group objects,
 * keeping the component class lean.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Gets the avatar image URL for the current user or group.
 */
export function getHeaderAvatarImage(
  user: CometChat.User | null,
  group: CometChat.Group | null
): string {
  if (user) return user.getAvatar() || '';
  if (group) return group.getIcon() || '';
  return '';
}

/**
 * Gets the avatar name (initials fallback) for the current user or group.
 */
export function getHeaderAvatarName(
  user: CometChat.User | null,
  group: CometChat.Group | null
): string {
  if (user) return user.getName() || '';
  if (group) return group.getName() || '';
  return '';
}

/**
 * Gets the display name for the header.
 */
export function getHeaderDisplayName(
  user: CometChat.User | null,
  group: CometChat.Group | null
): string {
  if (user) return user.getName() || '';
  if (group) return group.getName() || '';
  return '';
}

/**
 * Gets the member count text for a group.
 */
export function getGroupMemberCountText(memberCount: number): string {
  if (memberCount <= 0) return '';
  const key = memberCount === 1 ? 'group_member' : 'group_members';
  return `${memberCount} ${CometChatLocalize.getLocalizedString(key)}`;
}

/**
 * Checks if the user is currently online.
 */
export function isUserOnline(
  user: CometChat.User | null,
  userStatus: string | null
): boolean {
  if (!user) return false;
  const status = userStatus || user.getStatus();
  return status === CometChat.USER_STATUS.ONLINE;
}

/**
 * Gets the last active timestamp for a user.
 */
export function getLastActiveTimestamp(
  user: CometChat.User | null,
  userStatus: string | null
): number | null {
  if (!user) return null;
  const status = userStatus || user.getStatus();
  if (status === CometChat.USER_STATUS.ONLINE) return null;
  return user.getLastActiveAt() || null;
}

/**
 * Gets the calendar date format object for last active display.
 */
export function getLastActiveDateFormat(): CalendarObject {
  return {
    yesterday: CometChatLocalize.getLocalizedString('yesterday'),
    today: CometChatLocalize.getLocalizedString('today'),
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY'
  };
}
