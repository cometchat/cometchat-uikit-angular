/**
 * CometChat SDK User/Message Mock Factories
 *
 * Factories for User, GroupMember, TextMessage, MediaMessage, and error helpers.
 *
 * @module testing/mock-sdk-user
 * _Requirements: 15.5_
 */

import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ─── Auto-increment counter for message IDs ───
let _nextMessageId = 1;

/**
 * Resets the internal message ID counter.
 */
export function resetMockMessageIdCounter(): void {
  _nextMessageId = 1;
}

// ─── User ───

/**
 * Creates a mock CometChat.User with sensible defaults.
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

  if (overrides?.role) user.setRole(overrides.role);
  if (overrides?.lastActiveAt) user.setLastActiveAt(overrides.lastActiveAt);
  if (overrides?.statusMessage) user.setStatusMessage(overrides.statusMessage);
  if (overrides?.link) user.setLink(overrides.link);
  if (overrides?.metadata) user.setMetadata(overrides.metadata);
  if (overrides?.tags) user.setTags(overrides.tags);
  if (overrides?.deactivatedAt) user.setDeactivatedAt(overrides.deactivatedAt);
  if (overrides?.blockedByMe !== undefined) user.setBlockedByMe(overrides.blockedByMe);
  if (overrides?.hasBlockedMe !== undefined) user.setHasBlockedMe(overrides.hasBlockedMe);

  return user;
}

// ─── GroupMember ───

/**
 * Creates a mock CometChat.GroupMember with sensible defaults.
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

  if (overrides?.joinedAt) member.setJoinedAt(overrides.joinedAt);
  if (overrides?.guid) member.setGuid(overrides.guid);

  return member as unknown as CometChat.GroupMember;
}

// ─── TextMessage ───

/**
 * Creates a mock CometChat.TextMessage with sensible defaults.
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

  if (overrides?.deliveredAt) message.setDeliveredAt(overrides.deliveredAt);
  if (overrides?.readAt) message.setReadAt(overrides.readAt);
  if (overrides?.parentMessageId) message.setParentMessageId(overrides.parentMessageId);
  if (overrides?.replyCount) message.setReplyCount(overrides.replyCount);
  if (overrides?.mentionedUsers) message.setMentionedUsers(overrides.mentionedUsers);
  if (overrides?.metadata) message.setMetadata(overrides.metadata);
  if (overrides?.status) message.setStatus(overrides.status);

  return message as unknown as CometChat.TextMessage;
}

// ─── MediaMessage ───

/**
 * Creates a mock CometChat.MediaMessage with sensible defaults.
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

// ─── Error Simulation ───

/**
 * Creates a CometChat.CometChatException for testing error paths.
 */
export function createMockSDKError(
  code = 'ERR_TEST',
  message = 'Mock SDK error',
  details?: string
): CometChat.CometChatException {
  return new CometChat.CometChatException({ code, message, details });
}

/**
 * Mocks a CometChat static method to reject with an error.
 */
export function mockSDKReject(method: string, error?: CometChat.CometChatException): void {
  vi.spyOn(CometChat as any, method).mockRejectedValue(
    error ?? createMockSDKError('ERR_TEST', `Mock SDK error for ${method}`)
  );
}
