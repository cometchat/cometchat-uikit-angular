/**
 * Mock Media Message Factories
 *
 * Factories for file, audio, video, image, sticker, collaborative document,
 * and whiteboard message types.
 *
 * @module testing/mock-messages-media
 * _Requirements: 15.5, 3.1_
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  createMockUser,
  createMockMediaMessage,
} from './mock-sdk';

// Re-export for convenience
export { createMockMediaMessage };

// ─── Auto-increment counter ───
let _nextId = 20000;

function nextId(): number {
  return _nextId++;
}

// ─── File Message ───

/**
 * Creates a mock file message (CometChat.MediaMessage with type FILE).
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

// ─── Sticker Message ───

/**
 * Creates a mock sticker message (CometChat.CustomMessage with type `extension_sticker`).
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
    'extension_sticker',
    customData
  );

  message.setId(overrides?.id ?? nextId());
  message.setMuid(`muid-sticker-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

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
 * Creates a mock collaborative document message.
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
    'extension_document',
    { document_url: documentUrl }
  );

  message.setId(overrides?.id ?? nextId());
  message.setMuid(`muid-doc-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

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
 * Creates a mock collaborative whiteboard message.
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
    'extension_whiteboard',
    { board_url: boardUrl }
  );

  message.setId(overrides?.id ?? nextId());
  message.setMuid(`muid-wb-${message.getId()}`);
  message.setSender(overrides?.sender ?? createMockUser());
  message.setSentAt(overrides?.sentAt ?? Math.floor(Date.now() / 1000));

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
