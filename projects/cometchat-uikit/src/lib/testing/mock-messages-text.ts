/**
 * Mock Text/Action/Delete Message Factories
 *
 * Factories for text, action, deleted, and call message types.
 *
 * @module testing/mock-messages-text
 * _Requirements: 15.5, 3.1_
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  createMockUser,
  createMockGroup,
  createMockTextMessage,
  createMockCall,
} from './mock-sdk';

// Re-exports for convenience
export { createMockTextMessage, createMockCall };

// ─── Auto-increment counter for custom message IDs ───
let _nextCustomMessageId = 10000;

/**
 * Resets the internal custom message ID counter.
 */
export function resetCustomMessageIdCounter(): void {
  _nextCustomMessageId = 10000;
}

// ─── Custom message type constants ───
export const CUSTOM_MESSAGE_TYPES = {
  EXTENSION_POLL: 'extension_poll',
  EXTENSION_STICKER: 'extension_sticker',
  EXTENSION_DOCUMENT: 'extension_document',
  EXTENSION_WHITEBOARD: 'extension_whiteboard',
  MEETING: 'meeting',
} as const;

// ─── Poll Message ───

/**
 * Creates a mock poll message (CometChat.CustomMessage with type `extension_poll`).
 */
export function createMockPollMessage(
  overrides?: Partial<{
    id: number;
    question: string;
    options: Record<string, string>;
    results: {
      total: number;
      options: Record<string, { count: number; voters?: Record<string, any> }>;
    };
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const question = overrides?.question ?? 'What is your favorite color?';
  const options = overrides?.options ?? { '1': 'Red', '2': 'Blue', '3': 'Green' };
  const results = overrides?.results ?? {
    total: 0,
    options: Object.fromEntries(Object.keys(options).map(key => [key, { count: 0, voters: {} }])),
  };

  const customData = { question, options };

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    CUSTOM_MESSAGE_TYPES.EXTENSION_POLL,
    customData
  );

  message.setId(overrides?.id ?? _nextCustomMessageId++);
  message.setMuid(`muid-poll-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  message.setMetadata({
    '@injected': {
      extensions: {
        polls: {
          id: String(message.getId()),
          question,
          options,
          results,
        },
      },
    },
  });

  return message as unknown as CometChat.CustomMessage;
}

// ─── Action Message ───

/**
 * Creates a mock action message (CometChat.Action) for group member events.
 */
export function createMockActionMessage(
  overrides?: Partial<{
    id: number;
    action: string;
    messageText: string;
    actionBy: CometChat.User;
    actionOn: CometChat.User;
    actionFor: CometChat.Group;
    sender: CometChat.User;
    receiverId: string;
    sentAt: number;
  }>
): CometChat.Action {
  const id = overrides?.id ?? _nextCustomMessageId++;
  const action = overrides?.action ?? 'joined';
  const sender = overrides?.sender ?? createMockUser({ name: 'Admin' });
  const actionBy = overrides?.actionBy ?? sender;
  const actionOn = overrides?.actionOn ?? createMockUser({ uid: 'user-2', name: 'Member' });
  const actionFor = overrides?.actionFor ?? createMockGroup();
  const messageText =
    overrides?.messageText ?? `${actionBy.getName()} ${action} ${actionOn.getName()}`;
  const sentAt = overrides?.sentAt ?? Math.floor(Date.now() / 1000);
  const receiverId = overrides?.receiverId ?? actionFor.getGuid();

  return {
    getId: () => id,
    getMuid: () => `muid-action-${id}`,
    getType: () => 'groupMember',
    getCategory: () => CometChat.CATEGORY_ACTION,
    getAction: () => action,
    getMessage: () => messageText,
    getActionBy: () => actionBy,
    getActionOn: () => actionOn,
    getActionFor: () => actionFor,
    getSender: () => sender,
    getReceiver: () => actionFor,
    getReceiverType: () => CometChat.RECEIVER_TYPE.GROUP,
    getReceiverId: () => receiverId,
    getSentAt: () => sentAt,
    getConversationId: () => `group_${receiverId}`,
    getParentMessageId: () => 0,
    getData: () => ({
      extras: { scope: { new: 'participant' } },
    }),
    getMetadata: () => null,
    setMetadata: () => {},
  } as unknown as CometChat.Action;
}

// ─── Delete Message ───

/**
 * Creates a mock deleted message — a text message marked as deleted.
 */
export function createMockDeletedMessage(
  overrides?: Partial<{
    id: number;
    text: string;
    sender: CometChat.User;
    deletedBy: string;
    deletedAt: number;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.TextMessage {
  const message = createMockTextMessage({
    id: overrides?.id,
    text: overrides?.text ?? 'This message was deleted',
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
    sentAt: overrides?.sentAt,
  });

  const deletedAt = overrides?.deletedAt ?? Math.floor(Date.now() / 1000);
  message.setDeletedAt(deletedAt);
  message.setDeletedBy(overrides?.deletedBy ?? 'user-1');

  return message;
}

// ─── Call Message ───

/**
 * Creates a mock call message. Alias for `createMockCall` from `mock-sdk.ts`.
 */
export function createMockCallMessage(
  overrides?: Partial<{
    sessionId: string;
    type: string;
    status: string;
    duration: number;
    callInitiator: CometChat.User;
    callReceiver: CometChat.User | CometChat.Group;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.Call {
  return createMockCall(overrides);
}
