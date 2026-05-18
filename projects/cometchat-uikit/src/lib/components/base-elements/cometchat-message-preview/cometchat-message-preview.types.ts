/**
 * Types for CometChatMessagePreview component.
 */

/** Preview mode type for message preview context */
export type MessagePreviewMode = 'reply' | 'edit';

/** Message type constants for type checking */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  STICKER: 'extension_sticker',
  POLL: 'extension_poll',
} as const;
