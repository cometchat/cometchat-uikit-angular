/**
 * Mock Message Object Factories
 *
 * Centralized factories for creating mock message objects of every type used
 * across the CometChat Angular V5 UIKit. Builds on the base factories in
 * `mock-sdk.ts` and adds specialized factories for poll, sticker,
 * collaborative document/whiteboard, action, and delete messages.
 *
 * Each factory accepts optional overrides and returns a properly shaped object
 * with sensible defaults matching how the real components consume them.
 *
 * @module testing/mock-messages
 * _Requirements: 15.5, 3.1_
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  createMockUser,
  createMockGroup,
  createMockTextMessage,
  createMockMediaMessage,
  createMockCall,
} from './mock-sdk';

// ─── Re-exports for convenience ───
export { createMockTextMessage, createMockMediaMessage, createMockCall };

// ─── Custom message type constants (matching codebase usage) ───
export const CUSTOM_MESSAGE_TYPES = {
  EXTENSION_POLL: 'extension_poll',
  EXTENSION_STICKER: 'extension_sticker',
  EXTENSION_DOCUMENT: 'extension_document',
  EXTENSION_WHITEBOARD: 'extension_whiteboard',
  MEETING: 'meeting',
} as const;

// ─── Auto-increment counter for custom message IDs ───
let _nextCustomMessageId = 10000;

/**
 * Resets the internal custom message ID counter.
 * Useful in `beforeEach` for deterministic IDs.
 */
export function resetCustomMessageIdCounter(): void {
  _nextCustomMessageId = 10000;
}

// ─── File Message (MediaMessage with file type) ───

/**
 * Creates a mock file message (CometChat.MediaMessage with type FILE).
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.MediaMessage configured as a file message
 *
 * @example
 * ```ts
 * const fileMsg = createMockFileMessage({ fileName: 'report.pdf', fileSize: 204800 });
 * ```
 */
export function createMockFileMessage(
  overrides?: Partial<{
    id: number;
    url: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    mimeType: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.MediaMessage {
  return createMockMediaMessage({
    messageType: CometChat.MESSAGE_TYPE.FILE,
    url: overrides?.url ?? 'https://example.com/files/document.pdf',
    fileName: overrides?.fileName ?? 'document.pdf',
    fileExtension: overrides?.fileExtension ?? 'pdf',
    fileSize: overrides?.fileSize ?? 204800,
    mimeType: overrides?.mimeType ?? 'application/pdf',
    id: overrides?.id,
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
    sentAt: overrides?.sentAt,
  });
}

// ─── Audio Message ───

/**
 * Creates a mock audio message (CometChat.MediaMessage with type AUDIO).
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.MediaMessage configured as an audio message
 */
export function createMockAudioMessage(
  overrides?: Partial<{
    id: number;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.MediaMessage {
  return createMockMediaMessage({
    messageType: CometChat.MESSAGE_TYPE.AUDIO,
    url: overrides?.url ?? 'https://example.com/audio/recording.mp3',
    fileName: overrides?.fileName ?? 'recording.mp3',
    fileExtension: 'mp3',
    fileSize: overrides?.fileSize ?? 512000,
    mimeType: overrides?.mimeType ?? 'audio/mpeg',
    id: overrides?.id,
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
    sentAt: overrides?.sentAt,
  });
}

// ─── Video Message ───

/**
 * Creates a mock video message (CometChat.MediaMessage with type VIDEO).
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.MediaMessage configured as a video message
 */
export function createMockVideoMessage(
  overrides?: Partial<{
    id: number;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.MediaMessage {
  return createMockMediaMessage({
    messageType: CometChat.MESSAGE_TYPE.VIDEO,
    url: overrides?.url ?? 'https://example.com/video/clip.mp4',
    fileName: overrides?.fileName ?? 'clip.mp4',
    fileExtension: 'mp4',
    fileSize: overrides?.fileSize ?? 5242880,
    mimeType: overrides?.mimeType ?? 'video/mp4',
    id: overrides?.id,
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
    sentAt: overrides?.sentAt,
  });
}

// ─── Image Message ───

/**
 * Creates a mock image message (CometChat.MediaMessage with type IMAGE).
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.MediaMessage configured as an image message
 */
export function createMockImageMessage(
  overrides?: Partial<{
    id: number;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.MediaMessage {
  return createMockMediaMessage({
    messageType: CometChat.MESSAGE_TYPE.IMAGE,
    url: overrides?.url ?? 'https://example.com/images/photo.jpg',
    fileName: overrides?.fileName ?? 'photo.jpg',
    fileExtension: 'jpg',
    fileSize: overrides?.fileSize ?? 1048576,
    mimeType: overrides?.mimeType ?? 'image/jpeg',
    id: overrides?.id,
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
    sentAt: overrides?.sentAt,
  });
}

// ─── Poll Message (CustomMessage with extension_poll type) ───

/**
 * Creates a mock poll message (CometChat.CustomMessage with type `extension_poll`).
 *
 * The poll data is stored in metadata at `@injected.extensions.polls`, matching
 * how `CometChatPollBubbleComponent` extracts it.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.CustomMessage configured as a poll message
 *
 * @example
 * ```ts
 * const poll = createMockPollMessage({
 *   question: 'Favorite language?',
 *   options: { '1': 'TypeScript', '2': 'Rust', '3': 'Go' },
 * });
 * ```
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

  // Set metadata in the format expected by CometChatPollBubbleComponent:
  // metadata["@injected"]["extensions"]["polls"]
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

// ─── Sticker Message (CustomMessage with extension_sticker type) ───

/**
 * Creates a mock sticker message (CometChat.CustomMessage with type `extension_sticker`).
 *
 * The sticker URL is available via both `customData.sticker_url` and
 * `metadata.data.sticker_url`, matching the priority chain used by
 * `CometChatStickerBubbleComponent`.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.CustomMessage configured as a sticker message
 */
export function createMockStickerMessage(
  overrides?: Partial<{
    id: number;
    stickerUrl: string;
    stickerName: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const stickerUrl = overrides?.stickerUrl ?? 'https://example.com/stickers/smile.png';
  const stickerName = overrides?.stickerName ?? 'Smile';

  const customData = {
    sticker_url: stickerUrl,
    sticker_name: stickerName,
  };

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    CUSTOM_MESSAGE_TYPES.EXTENSION_STICKER,
    customData
  );

  message.setId(overrides?.id ?? _nextCustomMessageId++);
  message.setMuid(`muid-sticker-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  // Set metadata matching the sticker bubble's extraction priority chain
  message.setMetadata({
    data: {
      sticker_url: stickerUrl,
      sticker_name: stickerName,
    },
    sticker_url: stickerUrl,
  });

  return message as unknown as CometChat.CustomMessage;
}

// ─── Collaborative Document Message ───

/**
 * Creates a mock collaborative document message (CometChat.CustomMessage with
 * type `extension_document`).
 *
 * The document URL is stored in metadata at
 * `@injected.extensions.document.document_url`, matching how
 * `CometChatCollaborativeDocumentBubbleComponent` extracts it.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.CustomMessage configured as a collaborative document message
 */
export function createMockCollaborativeDocumentMessage(
  overrides?: Partial<{
    id: number;
    documentUrl: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const documentUrl = overrides?.documentUrl ?? 'https://example.com/documents/collab-doc-123';

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    CUSTOM_MESSAGE_TYPES.EXTENSION_DOCUMENT,
    { document_url: documentUrl }
  );

  message.setId(overrides?.id ?? _nextCustomMessageId++);
  message.setMuid(`muid-doc-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  // Metadata path: @injected -> extensions -> document -> document_url
  message.setMetadata({
    '@injected': {
      extensions: {
        document: {
          document_url: documentUrl,
        },
      },
    },
  });

  return message as unknown as CometChat.CustomMessage;
}

// ─── Collaborative Whiteboard Message ───

/**
 * Creates a mock collaborative whiteboard message (CometChat.CustomMessage with
 * type `extension_whiteboard`).
 *
 * The whiteboard URL is stored in metadata at
 * `@injected.extensions.whiteboard.board_url`, matching how
 * `CometChatCollaborativeWhiteboardBubbleComponent` extracts it.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.CustomMessage configured as a collaborative whiteboard message
 */
export function createMockCollaborativeWhiteboardMessage(
  overrides?: Partial<{
    id: number;
    boardUrl: string;
    sender: CometChat.User;
    receiverId: string;
    receiverType: string;
    sentAt: number;
  }>
): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId ?? 'receiver-1';
  const receiverType = overrides?.receiverType ?? CometChat.RECEIVER_TYPE.USER;
  const boardUrl = overrides?.boardUrl ?? 'https://example.com/whiteboards/board-456';

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    CUSTOM_MESSAGE_TYPES.EXTENSION_WHITEBOARD,
    { board_url: boardUrl }
  );

  message.setId(overrides?.id ?? _nextCustomMessageId++);
  message.setMuid(`muid-wb-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

  // Metadata path: @injected -> extensions -> whiteboard -> board_url
  message.setMetadata({
    '@injected': {
      extensions: {
        whiteboard: {
          board_url: boardUrl,
        },
      },
    },
  });

  return message as unknown as CometChat.CustomMessage;
}

// ─── Action Message ───

/**
 * Creates a mock action message (CometChat.Action) for group member events.
 *
 * Matches the shape produced by `GroupMemberUtils.createActionMessage()`.
 * Uses a plain-object mock since the Action constructor may require SDK init.
 *
 * @param overrides - Optional properties to override
 * @returns A mock conforming to CometChat.Action
 *
 * @example
 * ```ts
 * const action = createMockActionMessage({ action: 'kicked', messageText: 'Admin kicked User1' });
 * ```
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

// ─── Delete Message (marker for deleted messages) ───

/**
 * Creates a mock deleted message — a text message marked as deleted.
 *
 * In CometChat, deleted messages are regular messages with `deletedAt` set
 * and `deletedBy` populated. The `cometchat-delete-bubble` component renders
 * these with a "This message was deleted" placeholder.
 *
 * @param overrides - Optional properties to override
 * @returns A CometChat.TextMessage marked as deleted
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

// ─── Call Message (re-export with alias for consistency) ───

/**
 * Creates a mock call message. This is an alias for `createMockCall` from
 * `mock-sdk.ts`, provided here for completeness so all message type factories
 * are accessible from a single import.
 *
 * @param overrides - Optional properties to override
 * @returns A mock conforming to CometChat.Call
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
