/**
 * CometChat SDK Mock Factories
 *
 * Centralized mock factories for CometChat SDK objects used across the test suite.
 * Each factory accepts optional overrides and returns typed mock objects with
 * sensible defaults.
 *
 * These factories create real SDK instances where possible (User, Group, TextMessage,
 * MediaMessage) and plain-object mocks where SDK constructors require initialization
 * (Call). Error simulation helpers are also provided.
 *
 * @module testing/mock-sdk
 * _Requirements: 15.5_
 */

import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ─── Auto-increment counter for message IDs ───
let _nextMessageId = 1;

/**
 * Resets the internal message ID counter. Useful in `beforeEach` for deterministic IDs.
 */
export function resetMockMessageIdCounter(): void {
  _nextMessageId = 1;
}

// ─── User ───

/**
 * Creates a mock CometChat.User with sensible defaults.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.User instance
 *
 * @example
 * ```ts
 * const user = createMockUser({ name: 'Alice', status: 'offline' });
 * ```
 */
export function createMockUser(
  overrides?: Partial<{
    uid: string;
    name: string;
    avatar: string;
    status: string;
    role: string;
    lastActiveAt: number;
    statusMessage: string;
    link: string;
    metadata: object;
    tags: string[];
    deactivatedAt: number;
    blockedByMe: boolean;
    hasBlockedMe: boolean;
  }>
): CometChat.User {
  const uid = overrides?.uid ?? 'user-1';
  const user = new CometChat.User(uid);

  user.setName(overrides?.name ?? 'Test User');
  user.setAvatar(overrides?.avatar ?? 'https://example.com/avatar.png');
  user.setStatus(overrides?.status ?? CometChat.USER_STATUS.ONLINE);

  if (overrides?.role) {
    user.setRole(overrides.role);
  }
  if (overrides?.lastActiveAt) {
    user.setLastActiveAt(overrides.lastActiveAt);
  }
  if (overrides?.statusMessage) {
    user.setStatusMessage(overrides.statusMessage);
  }
  if (overrides?.link) {
    user.setLink(overrides.link);
  }
  if (overrides?.metadata) {
    user.setMetadata(overrides.metadata);
  }
  if (overrides?.tags) {
    user.setTags(overrides.tags);
  }
  if (overrides?.deactivatedAt) {
    user.setDeactivatedAt(overrides.deactivatedAt);
  }
  if (overrides?.blockedByMe !== undefined) {
    user.setBlockedByMe(overrides.blockedByMe);
  }
  if (overrides?.hasBlockedMe !== undefined) {
    user.setHasBlockedMe(overrides.hasBlockedMe);
  }

  return user;
}

// ─── Group ───

/**
 * Creates a mock CometChat.Group with sensible defaults.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.Group instance
 */
export function createMockGroup(
  overrides?: Partial<{
    guid: string;
    name: string;
    type: string;
    membersCount: number;
    icon: string;
    description: string;
    owner: string;
    hasJoined: boolean;
    createdAt: number;
    updatedAt: number;
    joinedAt: string;
    scope: string;
    tags: string[];
    metadata: object;
  }>
): CometChat.Group {
  const guid = overrides?.guid ?? 'group-1';
  const name = overrides?.name ?? 'Test Group';
  const type = overrides?.type ?? CometChat.GROUP_TYPE.PUBLIC;

  const group = new CometChat.Group(guid, name, type);

  group.setIcon(overrides?.icon ?? 'https://example.com/group.png');
  group.setMembersCount(overrides?.membersCount ?? 5);

  if (overrides?.description) {
    group.setDescription(overrides.description);
  }
  if (overrides?.owner) {
    group.setOwner(overrides.owner);
  }
  if (overrides?.hasJoined !== undefined) {
    group.setHasJoined(overrides.hasJoined);
  }
  if (overrides?.createdAt) {
    group.setCreatedAt(overrides.createdAt);
  }
  if (overrides?.updatedAt) {
    group.setUpdatedAt(overrides.updatedAt);
  }
  if (overrides?.joinedAt) {
    group.setJoinedAt(overrides.joinedAt);
  }
  if (overrides?.scope) {
    group.setScope(overrides.scope);
  }
  if (overrides?.tags) {
    group.setTags(overrides.tags);
  }
  if (overrides?.metadata) {
    group.setMetadata(overrides.metadata);
  }

  return group as unknown as CometChat.Group;
}

// ─── GroupMember ───

/**
 * Creates a mock CometChat.GroupMember with sensible defaults.
 *
 * GroupMember extends User, so it inherits all User getter methods.
 * Uses `new CometChat.GroupMember(uid, scope)` constructor.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.GroupMember instance
 *
 * @example
 * ```ts
 * const member = createMockGroupMember({ name: 'Alice', scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN });
 * ```
 */
export function createMockGroupMember(
  overrides?: Partial<{
    uid: string;
    name: string;
    avatar: string;
    scope: string;
    joinedAt: number;
    guid: string;
  }>
): CometChat.GroupMember {
  const uid = overrides?.uid ?? 'member-1';
  const scope = overrides?.scope ?? CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;

  const member = new CometChat.GroupMember(uid, scope);

  member.setName(overrides?.name ?? 'Test Member');
  member.setAvatar(overrides?.avatar ?? 'https://example.com/member.png');

  if (overrides?.joinedAt) {
    member.setJoinedAt(overrides.joinedAt);
  }
  if (overrides?.guid) {
    member.setGuid(overrides.guid);
  }

  return member as unknown as CometChat.GroupMember;
}

// ─── Conversation ───

/**
 * Creates a mock CometChat.Conversation with sensible defaults.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.Conversation instance
 */
export function createMockConversation(
  overrides?: Partial<{
    id: string;
    type: 'user' | 'group';
    conversationWith: CometChat.User | CometChat.Group;
    lastMessage: CometChat.BaseMessage;
    unreadMessageCount: number;
    tags: string[];
    unreadMentionsCount: number;
    lastReadMessageId: string;
    latestMessageId: string;
  }>
): CometChat.Conversation {
  const type = overrides?.type ?? 'user';
  const conversationWith =
    overrides?.conversationWith ?? (type === 'user' ? createMockUser() : createMockGroup());

  const entityId =
    overrides?.id ??
    ((conversationWith as any).getUid
      ? (conversationWith as any).getUid()
      : (conversationWith as any).getGuid());

  const receiverType =
    type === 'user' ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;

  const lastMessage =
    overrides?.lastMessage ??
    createMockTextMessage({
      receiverId: entityId,
      receiverType,
    });

  const conversation = new CometChat.Conversation(
    entityId,
    receiverType,
    lastMessage,
    conversationWith as any,
    overrides?.unreadMessageCount ?? 0,
    overrides?.tags ?? [],
    overrides?.unreadMentionsCount ?? 0,
    overrides?.lastReadMessageId ?? '',
    overrides?.latestMessageId ?? ''
  );

  return conversation as unknown as CometChat.Conversation;
}

// ─── TextMessage ───

/**
 * Creates a mock CometChat.TextMessage with sensible defaults.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.TextMessage instance
 */
export function createMockTextMessage(
  overrides?: Partial<{
    id: number;
    text: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
    deliveredAt: number;
    readAt: number;
    parentMessageId: number;
    replyCount: number;
    mentionedUsers: CometChat.User[];
    metadata: object;
    status: string;
  }>
): CometChat.TextMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;

  const message = new CometChat.TextMessage(receiverId, overrides?.text ?? 'Hello', receiverType);

  message.setId(overrides?.id ?? _nextMessageId++);
  message.setMuid(`muid-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  if (overrides?.deliveredAt) {
    message.setDeliveredAt(overrides.deliveredAt);
  }
  if (overrides?.readAt) {
    message.setReadAt(overrides.readAt);
  }
  if (overrides?.parentMessageId) {
    message.setParentMessageId(overrides.parentMessageId);
  }
  if (overrides?.replyCount) {
    message.setReplyCount(overrides.replyCount);
  }
  if (overrides?.mentionedUsers) {
    message.setMentionedUsers(overrides.mentionedUsers);
  }
  if (overrides?.metadata) {
    message.setMetadata(overrides.metadata);
  }
  if (overrides?.status) {
    message.setStatus(overrides.status);
  }

  return message as unknown as CometChat.TextMessage;
}

// ─── MediaMessage ───

/**
 * Creates a mock CometChat.MediaMessage with sensible defaults.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.MediaMessage instance
 */
export function createMockMediaMessage(
  overrides?: Partial<{
    id: number;
    url: string;
    mimeType: string;
    messageType: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.MediaMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const url = overrides?.url ?? 'https://example.com/media.jpg';
  const messageType = overrides?.messageType ?? CometChat.MESSAGE_TYPE.IMAGE;

  const message = new CometChat.MediaMessage(receiverId, url, messageType, receiverType);

  message.setId(overrides?.id ?? _nextMessageId++);
  message.setMuid(`muid-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  const mimeType = overrides?.mimeType ?? 'image/jpeg';
  const fileName = overrides?.fileName ?? 'media.jpg';
  const fileExtension = overrides?.fileExtension ?? 'jpg';
  const fileSize = overrides?.fileSize ?? 102400;

  // Build an attachment-like object with getter methods that the SDK's
  // internal toJSON/setAttachment expects (e.g. getExtension, getMimeType).
  // We override getAttachments() directly because the SDK's setAttachment()
  // expects a proper CometChat.Attachment instance with getter methods that
  // may not be available in the test environment.
  const attachment = {
    fileName,
    fileExtension,
    fileSize,
    fileMimeType: mimeType,
    fileUrl: url,
    url,
    name: fileName,
    mimeType,
    size: fileSize,
    extension: fileExtension,
    getExtension: () => fileExtension,
    getMimeType: () => mimeType,
    getSize: () => fileSize,
    getName: () => fileName,
    getUrl: () => url,
  };

  (message as any).getAttachments = () => [attachment];
  (message as any).getAttachment = () => attachment;

  return message as unknown as CometChat.MediaMessage;
}

// ─── Call ───

/**
 * Creates a mock CometChat.Call object.
 *
 * Uses a plain-object mock with getter methods since the Call constructor
 * may require SDK initialization.
 *
 * @param overrides - Optional properties to override
 * @returns A mock conforming to CometChat.Call
 */
export function createMockCall(
  overrides?: Partial<{
    sessionId: string;
    type: string;
    status: string;
    duration: number;
    callInitiator: CometChat.User;
    callReceiver: CometChat.User | CometChat.Group;
    receiverType: string;
    sentAt: number;
    metadata: object;
    data: object;
  }>
): CometChat.Call {
  const sessionId = overrides?.sessionId ?? 'session-1';
  const type = overrides?.type ?? CometChat.CALL_TYPE.AUDIO;
  const status = overrides?.status ?? 'initiated';
  const duration = overrides?.duration ?? 0;
  const initiator = overrides?.callInitiator ?? createMockUser({ name: 'Call Initiator' });
  const receiver = overrides?.callReceiver ?? createMockUser({ name: 'Call Receiver' });
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const sentAt = overrides?.sentAt ?? Math.floor(Date.now() / 1000);
  const metadata = overrides?.metadata ?? {};
  const data = overrides?.data ?? {};

  return {
    getSessionId: () => sessionId,
    getType: () => type,
    getStatus: () => status,
    getCallStatus: () => status,
    getDuration: () => duration,
    getMetadata: () => metadata,
    getData: () => data,
    getCallInitiator: () => initiator,
    getCallReceiver: () => receiver,
    getSender: () => initiator,
    getReceiver: () => receiver,
    getReceiverType: () => receiverType,
    getAction: () => status,
    getInitiatedAt: () => sentAt,
    getJoinedAt: () => sentAt + 5,
    getSentAt: () => sentAt,
  } as unknown as CometChat.Call;
}

// ─── Error Simulation ───

/**
 * Creates a CometChat.CometChatException for testing error paths.
 *
 * @param code - Error code string
 * @param message - Human-readable error message
 * @param details - Optional additional details
 * @returns A CometChat.CometChatException instance
 */
export function createMockSDKError(
  code = 'ERR_TEST',
  message = 'Mock SDK error',
  details?: string
): CometChat.CometChatException {
  return new CometChat.CometChatException({
    code,
    message,
    details,
  });
}

/**
 * Mocks a CometChat static method to reject with an error.
 *
 * Useful for testing error handling paths in services that call SDK methods.
 *
 * @param method - The CometChat static method name to mock (e.g., 'fetchConversations')
 * @param error - Optional custom error; defaults to a generic test error
 *
 * @example
 * ```ts
 * mockSDKReject('acceptCall');
 * // Now CometChat.acceptCall() will reject with a CometChatException
 * ```
 */
export function mockSDKReject(method: string, error?: CometChat.CometChatException): void {
  vi.spyOn(CometChat as any, method).mockRejectedValue(
    error ?? createMockSDKError('ERR_TEST', `Mock SDK error for ${method}`)
  );
}
