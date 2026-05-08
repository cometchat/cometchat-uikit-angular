/**
 * Utility helpers for CometChatGroups component.
 *
 * Extracted from cometchat-groups.component.ts to isolate
 * member count text, group type display, and ARIA label generation.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ==================== Display Text Helpers ====================

/**
 * Returns the localized member count text for a group.
 * e.g. "5 Members" or "1 Member"
 */
export function getGroupMemberCountText(group: CometChat.Group): string {
  const count = group.getMembersCount();
  if (count <= 0) return '';
  const key = count === 1 ? 'group_member' : 'group_members';
  return `${count} ${CometChatLocalize.getLocalizedString(key)}`;
}

/**
 * Returns the display string for a group's type (public, private, password).
 */
export function getGroupTypeDisplay(group: CometChat.Group): string {
  const type = group.getType();
  switch (type) {
    case CometChat.GROUP_TYPE.PUBLIC:
      return CometChatLocalize.getLocalizedString('group_type_public');
    case CometChat.GROUP_TYPE.PRIVATE:
      return CometChatLocalize.getLocalizedString('group_type_private');
    case CometChat.GROUP_TYPE.PASSWORD:
      return CometChatLocalize.getLocalizedString('group_type_password');
    default:
      return type || '';
  }
}

// ==================== ARIA Labels ====================

/**
 * Returns the ARIA label for a group list item.
 *
 * @param group - The group object
 * @param hideGroupType - Whether group type is hidden
 */
export function getGroupAriaLabel(
  group: CometChat.Group,
  hideGroupType: boolean
): string {
  const name = group.getName() || '';
  const memberCount = group.getMembersCount();
  const memberText = memberCount === 1
    ? CometChatLocalize.getLocalizedString('group_member')
    : CometChatLocalize.getLocalizedString('group_members');

  const parts = [`${name}, ${memberCount} ${memberText}`];

  if (!hideGroupType) {
    const typeDisplay = getGroupTypeDisplay(group);
    if (typeDisplay) parts.push(typeDisplay);
  }

  return parts.join(', ');
}

// ==================== Section Header ====================

/**
 * Determines if a section header should be shown before the group at the given index.
 */
export function shouldShowGroupSectionHeader(
  groupList: CometChat.Group[],
  index: number,
  showSectionHeader: boolean
): boolean {
  if (!showSectionHeader || groupList.length === 0) return false;
  if (index === 0) return true;

  const currentHeader = getGroupSectionHeaderValue(groupList[index]);
  const previousHeader = getGroupSectionHeaderValue(groupList[index - 1]);
  return currentHeader !== previousHeader;
}

/**
 * Gets the section header character for a group (first letter of name, uppercase).
 */
export function getGroupSectionHeaderValue(group: CometChat.Group): string {
  try {
    const name = group.getName();
    if (name && typeof name === 'string') return name.charAt(0).toUpperCase();
    return '#';
  } catch {
    return '#';
  }
}
