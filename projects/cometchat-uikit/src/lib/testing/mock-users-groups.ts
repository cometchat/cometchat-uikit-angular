/**
 * Mock User/Group/Conversation List Factories
 *
 * Centralized factories for creating lists of mock CometChat SDK objects
 * for list-based component testing (Conversations, Users, Groups, GroupMembers).
 * Builds on the single-item factories in `mock-sdk.ts`.
 *
 * Each list factory accepts a `count` parameter and optional per-item overrides
 * to support configurable list sizes and member counts.
 *
 * @module testing/mock-users-groups
 * _Requirements: 15.5, 4.1_
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { createMockUser, createMockGroup, createMockConversation } from './mock-sdk';

// ─── User List ───

/**
 * Options for customizing individual users in a generated list.
 */
export interface MockUserListOptions {
  /** Starting index for uid/name generation (default: 1) */
  startIndex?: number;
  /** Optional per-item overrides keyed by list index (0-based) */
  overrides?: Record<number, Partial<Parameters<typeof createMockUser>[0] & {}>>;
  /** Status to assign to all users (default: varies by index) */
  status?: string;
}

/**
 * Creates a list of mock CometChat.User objects.
 *
 * @param count - Number of users to generate
 * @param options - Optional configuration for the generated list
 * @returns An array of CometChat.User instances
 *
 * @example
 * ```ts
 * const users = createMockUserList(5);
 * const customUsers = createMockUserList(3, {
 *   overrides: { 0: { name: 'Alice', status: 'offline' } },
 * });
 * ```
 */
export function createMockUserList(count: number, options?: MockUserListOptions): CometChat.User[] {
  const startIndex = options?.startIndex ?? 1;
  const statuses = [CometChat.USER_STATUS.ONLINE, CometChat.USER_STATUS.OFFLINE];

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const itemOverrides = options?.overrides?.[i];

    return createMockUser({
      uid: `user-${index}`,
      name: `User ${index}`,
      avatar: `https://example.com/avatar-${index}.png`,
      status: options?.status ?? statuses[i % statuses.length],
      ...itemOverrides,
    });
  });
}

// ─── Group List ───

/**
 * Options for customizing individual groups in a generated list.
 */
export interface MockGroupListOptions {
  /** Starting index for guid/name generation (default: 1) */
  startIndex?: number;
  /** Optional per-item overrides keyed by list index (0-based) */
  overrides?: Record<number, Partial<Parameters<typeof createMockGroup>[0] & {}>>;
  /** Base member count (each group gets baseMembersCount + index) */
  baseMembersCount?: number;
}

/**
 * Creates a list of mock CometChat.Group objects.
 *
 * @param count - Number of groups to generate
 * @param options - Optional configuration for the generated list
 * @returns An array of CometChat.Group instances
 *
 * @example
 * ```ts
 * const groups = createMockGroupList(5);
 * const customGroups = createMockGroupList(3, {
 *   baseMembersCount: 10,
 *   overrides: { 1: { name: 'VIP Group', type: CometChat.GROUP_TYPE.PASSWORD } },
 * });
 * ```
 */
export function createMockGroupList(
  count: number,
  options?: MockGroupListOptions
): CometChat.Group[] {
  const startIndex = options?.startIndex ?? 1;
  const baseMembersCount = options?.baseMembersCount ?? 3;
  const groupTypes = [
    CometChat.GROUP_TYPE.PUBLIC,
    CometChat.GROUP_TYPE.PRIVATE,
    CometChat.GROUP_TYPE.PASSWORD,
  ];

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const itemOverrides = options?.overrides?.[i];

    return createMockGroup({
      guid: `group-${index}`,
      name: `Group ${index}`,
      icon: `https://example.com/group-${index}.png`,
      type: groupTypes[i % groupTypes.length],
      membersCount: baseMembersCount + i,
      ...itemOverrides,
    });
  });
}

// ─── Conversation List ───

/**
 * Options for customizing individual conversations in a generated list.
 */
export interface MockConversationListOptions {
  /** Starting index for conversation generation (default: 1) */
  startIndex?: number;
  /** Conversation type pattern: 'user', 'group', or 'mixed' (default: 'mixed') */
  type?: 'user' | 'group' | 'mixed';
  /** Optional per-item overrides keyed by list index (0-based) */
  overrides?: Record<number, Partial<Parameters<typeof createMockConversation>[0] & {}>>;
  /** Base unread count (each conversation gets baseUnreadCount * (index % 3)) */
  baseUnreadCount?: number;
}

/**
 * Creates a list of mock CometChat.Conversation objects.
 *
 * @param count - Number of conversations to generate
 * @param options - Optional configuration for the generated list
 * @returns An array of CometChat.Conversation instances
 *
 * @example
 * ```ts
 * const conversations = createMockConversationList(10);
 * const userConversations = createMockConversationList(5, { type: 'user' });
 * const mixed = createMockConversationList(4, {
 *   baseUnreadCount: 2,
 *   overrides: { 0: { unreadMessageCount: 99 } },
 * });
 * ```
 */
export function createMockConversationList(
  count: number,
  options?: MockConversationListOptions
): CometChat.Conversation[] {
  const startIndex = options?.startIndex ?? 1;
  const baseUnreadCount = options?.baseUnreadCount ?? 0;

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const itemOverrides = options?.overrides?.[i];

    // Determine conversation type
    let convType: 'user' | 'group';
    if (options?.type === 'mixed' || !options?.type) {
      convType = i % 2 === 0 ? 'user' : 'group';
    } else {
      convType = options.type;
    }

    // Create the entity for this conversation
    const conversationWith =
      convType === 'user'
        ? createMockUser({ uid: `conv-user-${index}`, name: `Conv User ${index}` })
        : createMockGroup({ guid: `conv-group-${index}`, name: `Conv Group ${index}` });

    return createMockConversation({
      type: convType,
      conversationWith,
      unreadMessageCount: baseUnreadCount * (i % 3),
      ...itemOverrides,
    });
  });
}

// ─── Group Member List ───

/**
 * Options for customizing individual group members in a generated list.
 */
export interface MockGroupMemberListOptions {
  /** Starting index for member generation (default: 1) */
  startIndex?: number;
  /** Optional per-item overrides keyed by list index (0-based) */
  overrides?: Record<
    number,
    Partial<{
      uid: string;
      name: string;
      avatar: string;
      scope: string;
    }>
  >;
}

/**
 * Creates a list of mock CometChat.GroupMember objects.
 *
 * @param count - Number of group members to generate
 * @param options - Optional configuration for the generated list
 * @returns An array of CometChat.GroupMember instances
 *
 * @example
 * ```ts
 * const members = createMockGroupMemberList(5);
 * const customMembers = createMockGroupMemberList(3, {
 *   overrides: { 0: { scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN } },
 * });
 * ```
 */
export function createMockGroupMemberList(
  count: number,
  options?: MockGroupMemberListOptions
): CometChat.GroupMember[] {
  const startIndex = options?.startIndex ?? 1;
  const scopes = [
    CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
    CometChat.GROUP_MEMBER_SCOPE.ADMIN,
  ];

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const itemOverrides = options?.overrides?.[i];

    const uid = itemOverrides?.uid ?? `member-${index}`;
    const scope = itemOverrides?.scope ?? scopes[i % scopes.length];

    const member = new CometChat.GroupMember(uid, scope);
    member.setName(itemOverrides?.name ?? `Member ${index}`);
    member.setAvatar(itemOverrides?.avatar ?? `https://example.com/member-${index}.png`);

    return member as unknown as CometChat.GroupMember;
  });
}
