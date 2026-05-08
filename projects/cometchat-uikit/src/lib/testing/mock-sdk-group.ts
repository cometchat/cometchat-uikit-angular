/**
 * CometChat SDK Group/Conversation/Call Mock Factories
 *
 * Factories for Group, Conversation, and Call mock objects.
 *
 * @module testing/mock-sdk-group
 * _Requirements: 15.5_
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { createMockUser } from './mock-sdk-user';
import { createMockTextMessage } from './mock-sdk-user';

// ─── Group ───

/**
 * Creates a mock CometChat.Group with sensible defaults.
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

  if (overrides?.description) group.setDescription(overrides.description);
  if (overrides?.owner) group.setOwner(overrides.owner);
  if (overrides?.hasJoined !== undefined) group.setHasJoined(overrides.hasJoined);
  if (overrides?.createdAt) group.setCreatedAt(overrides.createdAt);
  if (overrides?.updatedAt) group.setUpdatedAt(overrides.updatedAt);
  if (overrides?.joinedAt) group.setJoinedAt(overrides.joinedAt);
  if (overrides?.scope) group.setScope(overrides.scope);
  if (overrides?.tags) group.setTags(overrides.tags);
  if (overrides?.metadata) group.setMetadata(overrides.metadata);

  return group as unknown as CometChat.Group;
}

// ─── Conversation ───

/**
 * Creates a mock CometChat.Conversation with sensible defaults.
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

// ─── Call ───

/**
 * Creates a mock CometChat.Call object.
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
