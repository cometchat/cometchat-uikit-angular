/**
 * Types for CometChatMessagePreview component.
 */

/** Preview mode type for message preview context */
export type MessagePreviewMode = 'reply' | 'edit';

/**
 * Core message type constants for type checking.
 * Extension types (sticker/poll/whiteboard/document) live in
 * `CometChatUIKitConstants.ExtensionTypes` — use those instead of duplicating here.
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
} as const;
