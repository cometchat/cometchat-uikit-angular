/**
 * Section header and accessibility utilities for CometChatUsers component.
 *
 * Extracted from cometchat-users.component.ts to isolate
 * section header computation and ARIA label generation.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Section Header ====================

/**
 * Determines if a section header should be shown before the user at the given index.
 *
 * @param userList - Full list of users
 * @param index - Index of the current user
 * @param showSectionHeader - Whether section headers are enabled
 */
export function shouldShowUserSectionHeader(
  userList: CometChat.User[],
  index: number,
  showSectionHeader: boolean
): boolean {
  if (!showSectionHeader || userList.length === 0) return false;
  if (index === 0) return true;

  const currentHeader = getUserSectionHeaderValue(userList[index]);
  const previousHeader = getUserSectionHeaderValue(userList[index - 1]);
  return currentHeader !== previousHeader;
}

/**
 * Gets the section header character for a user (first letter of name, uppercase).
 */
export function getUserSectionHeaderValue(user: CometChat.User): string {
  try {
    const name = user.getName();
    if (name && typeof name === 'string') return name.charAt(0).toUpperCase();
    return '#';
  } catch {
    return '#';
  }
}

// ==================== ARIA Labels ====================

/**
 * Returns the ARIA label for a user list item.
 *
 * @param user - The user object
 * @param hideUserStatus - Whether user status is hidden
 */
export function getUserAriaLabel(
  user: CometChat.User,
  hideUserStatus: boolean
): string {
  const name = user.getName() || '';
  if (hideUserStatus) return name;
  const status = user.getStatus();
  if (!status) return name;
  return `${name}, ${status}`;
}

// ==================== Selection Range Helpers ====================

/**
 * Computes the range of indices to select/deselect for a shift-click operation.
 *
 * @param anchorIndex - The anchor (last clicked) index
 * @param clickedIndex - The newly clicked index
 */
export function computeSelectionRange(
  anchorIndex: number,
  clickedIndex: number
): { start: number; end: number } {
  return {
    start: Math.min(anchorIndex, clickedIndex),
    end: Math.max(anchorIndex, clickedIndex),
  };
}
