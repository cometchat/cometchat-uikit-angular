/**
 * Scope change utilities for CometChatGroupMembers component.
 *
 * Extracted from cometchat-group-members.component.ts to isolate
 * scope/role display logic and permission checking helpers.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ==================== Scope Display ====================

/**
 * Returns the localized display label for a group member scope/role.
 */
export function getScopeLabel(scope: string): string {
  switch (scope) {
    case CometChat.GROUP_MEMBER_SCOPE.ADMIN:
      return CometChatLocalize.getLocalizedString('group_member_scope_admin');
    case CometChat.GROUP_MEMBER_SCOPE.MODERATOR:
      return CometChatLocalize.getLocalizedString('group_member_scope_moderator');
    case CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT:
      return CometChatLocalize.getLocalizedString('group_member_scope_participant');
    default:
      return scope || CometChatLocalize.getLocalizedString('group_member_scope_participant');
  }
}

/**
 * Returns the available scope options for a change-scope dropdown.
 * Excludes the member's current scope.
 */
export function getAvailableScopeOptions(
  currentScope: string
): Array<{ label: string; value: string }> {
  const allScopes = [
    CometChat.GROUP_MEMBER_SCOPE.ADMIN,
    CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
    CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
  ];
  return allScopes
    .filter(scope => scope !== currentScope)
    .map(scope => ({ label: getScopeLabel(scope), value: scope }));
}

// ==================== Permission Checks ====================

/**
 * Checks whether the logged-in user can kick a group member.
 *
 * Rules:
 * - Admins can kick moderators and participants
 * - Moderators can kick participants only
 * - Cannot kick yourself
 * - Cannot kick the group owner
 */
export function canKickMember(
  loggedInMember: CometChat.GroupMember | null,
  targetMember: CometChat.GroupMember,
  group: CometChat.Group
): boolean {
  if (!loggedInMember) return false;
  if (loggedInMember.getUid() === targetMember.getUid()) return false;
  if (targetMember.getUid() === group.getOwner()) return false;

  const myScope = loggedInMember.getScope();
  const targetScope = targetMember.getScope();

  if (myScope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
    return targetScope !== CometChat.GROUP_MEMBER_SCOPE.ADMIN;
  }
  if (myScope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
    return targetScope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  }
  return false;
}

/**
 * Checks whether the logged-in user can ban a group member.
 * Same rules as kick.
 */
export function canBanMember(
  loggedInMember: CometChat.GroupMember | null,
  targetMember: CometChat.GroupMember,
  group: CometChat.Group
): boolean {
  return canKickMember(loggedInMember, targetMember, group);
}

/**
 * Checks whether the logged-in user can change a member's scope.
 *
 * Only admins can change scopes, and they cannot change the owner's scope.
 */
export function canChangeMemberScope(
  loggedInMember: CometChat.GroupMember | null,
  targetMember: CometChat.GroupMember,
  group: CometChat.Group
): boolean {
  if (!loggedInMember) return false;
  if (loggedInMember.getUid() === targetMember.getUid()) return false;
  if (targetMember.getUid() === group.getOwner()) return false;
  return loggedInMember.getScope() === CometChat.GROUP_MEMBER_SCOPE.ADMIN;
}

// ==================== ARIA Labels ====================

/**
 * Returns the ARIA label for a group member list item.
 */
export function getGroupMemberAriaLabel(
  member: CometChat.GroupMember,
  group: CometChat.Group
): string {
  const name = member.getName() || '';
  const scope = getScopeLabel(member.getScope());
  const isOwner = member.getUid() === group.getOwner();

  if (isOwner) {
    return `${name}, ${CometChatLocalize.getLocalizedString('group_owner')}, ${scope}`;
  }
  return `${name}, ${scope}`;
}
