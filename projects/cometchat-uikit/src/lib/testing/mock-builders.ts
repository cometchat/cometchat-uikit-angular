/**
 * Mock Request Builder Factories
 *
 * Provides mock implementations of CometChat SDK request builder classes.
 * Each builder preserves the fluent API pattern (all setter methods return `this`)
 * and provides spy-able `fetchNext()` / `fetchPrevious()` on the built request.
 *
 * @example
 * ```typescript
 * const builder = createMockConversationsRequestBuilder();
 * builder.setLimit(30).setConversationType('user');
 * const request = builder.build();
 * request.fetchNext.mockResolvedValue([createMockConversation()]);
 * ```
 */
import { vi, type MockInstance } from 'vitest';

/** A mock request object with a spy-able fetchNext method. */
export interface MockRequest {
  fetchNext: MockInstance;
}

/** A mock request object with both fetchNext and fetchPrevious (for Messages). */
export interface MockMessagesRequest extends MockRequest {
  fetchPrevious: MockInstance;
}

/** Base interface for all mock builders — includes build() returning a mock request. */
export interface MockBuilder<R extends MockRequest = MockRequest> {
  build: MockInstance & ((...args: any[]) => any);
  [key: string]: MockInstance;
}

/**
 * Creates a mock ConversationsRequestBuilder with all SDK setter methods.
 *
 * Setter methods (from SDK): setLimit, setConversationType, setSearchKeyword,
 * withUserAndGroupTags, setTags, withTags, setGroupTags, setUserTags,
 * setIncludeBlockedUsers, includeBlockedUsers, setWithBlockedInfo, withBlockedInfo,
 * setUnread, setPage, setHideAgentic, setOnlyAgentic
 */
export function createMockConversationsRequestBuilder(): MockBuilder<MockRequest> {
  const request: MockRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockRequest> = {
    setLimit: vi.fn().mockReturnThis(),
    setConversationType: vi.fn().mockReturnThis(),
    setSearchKeyword: vi.fn().mockReturnThis(),
    withUserAndGroupTags: vi.fn().mockReturnThis(),
    setTags: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
    setGroupTags: vi.fn().mockReturnThis(),
    setUserTags: vi.fn().mockReturnThis(),
    setIncludeBlockedUsers: vi.fn().mockReturnThis(),
    includeBlockedUsers: vi.fn().mockReturnThis(),
    setWithBlockedInfo: vi.fn().mockReturnThis(),
    withBlockedInfo: vi.fn().mockReturnThis(),
    setUnread: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    setHideAgentic: vi.fn().mockReturnThis(),
    setOnlyAgentic: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}

/**
 * Creates a mock UsersRequestBuilder with all SDK setter methods.
 *
 * Setter methods (from SDK): setLimit, setStatus, setSearchKeyword,
 * hideBlockedUsers, setRole, setRoles, friendsOnly, setTags, withTags,
 * setUIDs, sortBy, sortByOrder, searchIn, setPage
 */
export function createMockUsersRequestBuilder(): MockBuilder<MockRequest> {
  const request: MockRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockRequest> = {
    setLimit: vi.fn().mockReturnThis(),
    setStatus: vi.fn().mockReturnThis(),
    setSearchKeyword: vi.fn().mockReturnThis(),
    hideBlockedUsers: vi.fn().mockReturnThis(),
    setRole: vi.fn().mockReturnThis(),
    setRoles: vi.fn().mockReturnThis(),
    friendsOnly: vi.fn().mockReturnThis(),
    setTags: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
    setUIDs: vi.fn().mockReturnThis(),
    sortBy: vi.fn().mockReturnThis(),
    sortByOrder: vi.fn().mockReturnThis(),
    searchIn: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}

/**
 * Creates a mock GroupsRequestBuilder with all SDK setter methods.
 *
 * Setter methods (from SDK): setLimit, setSearchKeyword, joinedOnly,
 * setTags, withTags, setPage
 */
export function createMockGroupsRequestBuilder(): MockBuilder<MockRequest> {
  const request: MockRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockRequest> = {
    setLimit: vi.fn().mockReturnThis(),
    setSearchKeyword: vi.fn().mockReturnThis(),
    joinedOnly: vi.fn().mockReturnThis(),
    setTags: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}

/**
 * Creates a mock MessagesRequestBuilder with all SDK setter methods.
 * The built request includes BOTH `fetchNext` and `fetchPrevious`.
 *
 * Setter methods (from SDK): setLimit, setGUID, setUID, setParentMessageId,
 * setTimestamp, setMessageId, setUnread, hideMessagesFromBlockedUsers,
 * setSearchKeyword, setUpdatedAfter, updatesOnly, setCategory, setCategories,
 * setType, setTypes, hideReplies, hideDeletedMessages, hasAttachments,
 * hasLinks, hasMentions, hasReactions, setMentionedUIDs, setTags, withTags,
 * mentionsWithTagInfo, mentionsWithBlockedInfo, setInteractionGoalCompletedOnly,
 * setAttachmentTypes, withParent, hideQuotedMessages
 */
export function createMockMessagesRequestBuilder(): MockBuilder<MockMessagesRequest> {
  const request: MockMessagesRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
    fetchPrevious: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockMessagesRequest> = {
    setLimit: vi.fn().mockReturnThis(),
    setGUID: vi.fn().mockReturnThis(),
    setUID: vi.fn().mockReturnThis(),
    setParentMessageId: vi.fn().mockReturnThis(),
    setTimestamp: vi.fn().mockReturnThis(),
    setMessageId: vi.fn().mockReturnThis(),
    setUnread: vi.fn().mockReturnThis(),
    hideMessagesFromBlockedUsers: vi.fn().mockReturnThis(),
    setSearchKeyword: vi.fn().mockReturnThis(),
    setUpdatedAfter: vi.fn().mockReturnThis(),
    updatesOnly: vi.fn().mockReturnThis(),
    setCategory: vi.fn().mockReturnThis(),
    setCategories: vi.fn().mockReturnThis(),
    setType: vi.fn().mockReturnThis(),
    setTypes: vi.fn().mockReturnThis(),
    hideReplies: vi.fn().mockReturnThis(),
    hideDeletedMessages: vi.fn().mockReturnThis(),
    hasAttachments: vi.fn().mockReturnThis(),
    hasLinks: vi.fn().mockReturnThis(),
    hasMentions: vi.fn().mockReturnThis(),
    hasReactions: vi.fn().mockReturnThis(),
    setMentionedUIDs: vi.fn().mockReturnThis(),
    setTags: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
    mentionsWithTagInfo: vi.fn().mockReturnThis(),
    mentionsWithBlockedInfo: vi.fn().mockReturnThis(),
    setInteractionGoalCompletedOnly: vi.fn().mockReturnThis(),
    setAttachmentTypes: vi.fn().mockReturnThis(),
    withParent: vi.fn().mockReturnThis(),
    hideQuotedMessages: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}

/**
 * Creates a mock GroupMembersRequestBuilder with all SDK setter methods.
 *
 * Setter methods (from SDK): setGuid, setLimit, setSearchKeyword,
 * setScopes, setPage, setStatus
 */
export function createMockGroupMembersRequestBuilder(): MockBuilder<MockRequest> {
  const request: MockRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockRequest> = {
    setGuid: vi.fn().mockReturnThis(),
    setLimit: vi.fn().mockReturnThis(),
    setSearchKeyword: vi.fn().mockReturnThis(),
    setScopes: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    setStatus: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}

/**
 * Creates a mock ReactionsRequestBuilder with all SDK setter methods.
 *
 * Setter methods (from SDK): setLimit, setMessageId, setReaction
 */
export function createMockReactionsRequestBuilder(): MockBuilder<MockRequest> {
  const request: MockRequest = {
    fetchNext: vi.fn().mockResolvedValue([]),
  };

  const builder: MockBuilder<MockRequest> = {
    setLimit: vi.fn().mockReturnThis(),
    setMessageId: vi.fn().mockReturnThis(),
    setReaction: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(request),
  };

  return builder;
}
