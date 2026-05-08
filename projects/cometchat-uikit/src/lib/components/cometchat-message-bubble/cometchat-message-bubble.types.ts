/**
 * Types, interfaces, and constants for CometChatMessageBubble component.
 *
 * Extracted from cometchat-message-bubble.component.ts to keep the
 * component class focused on UI logic while this file owns all type definitions.
 */

// ==================== Bubble Type Maps ====================

/**
 * Mapping of message type/category combinations to CSS class names.
 * Used to apply type-specific styling to message bubbles.
 * Format: '{type}_{category}' → CSS class suffix
 */
export const BUBBLE_TYPE_MAP: Record<string, string> = {
  text_message: 'cometchat-message-bubble__text-message',
  audio_message: 'cometchat-message-bubble__audio-message',
  delete_action: 'cometchat-message-bubble__delete-message',
  file_message: 'cometchat-message-bubble__file-message',
  groupMember_action: 'cometchat-message-bubble__group-message',
  image_message: 'cometchat-message-bubble__image-message',
  video_message: 'cometchat-message-bubble__video-message',
  extension_document_custom: 'cometchat-message-bubble__document-message',
  extension_whiteboard_custom: 'cometchat-message-bubble__whiteboard-message',
  extension_poll_custom: 'cometchat-message-bubble__poll-message',
  extension_sticker_custom: 'cometchat-message-bubble__sticker-message',
  audio_call: 'cometchat-message-bubble__audio-call',
  video_call: 'cometchat-message-bubble__video-call',
  meeting_custom: 'cometchat-message-bubble__meeting-message',
};

/**
 * Mapping of message type/category combinations to content type identifiers.
 * Used to determine which bubble component to render for each message type.
 * Format: '{type}_{category}' → content type string
 *
 * NOTE: Call messages (category: 'call') are handled separately in getBubbleType()
 * to ensure they always render as action bubbles regardless of type.
 */
export const CONTENT_TYPE_MAP: Record<string, string> = {
  // Standard message types (category: message)
  text_message: 'text',
  image_message: 'image',
  video_message: 'video',
  audio_message: 'audio',
  file_message: 'file',

  // Custom message types (category: custom)
  extension_poll_custom: 'poll',
  extension_sticker_custom: 'sticker',
  extension_document_custom: 'document',
  extension_whiteboard_custom: 'whiteboard',
  meeting_custom: 'meeting',

  // Action types (category: action)
  groupMember_action: 'action',

  // Agentic message types (category: agentic)
  assistant_agentic: 'ai-assistant',
  tool_result_agentic: 'tool-result',
  tool_arguments_agentic: 'tool-arguments',
};

// ==================== Option Distribution Types ====================

/**
 * Result of distributing message options between quick-access and overflow menu.
 */
export interface DistributedOptions<T> {
  /** Options shown directly on the bubble (quick access) */
  quickOptions: T[];
  /** Options shown in the overflow/context menu */
  overflowOptions: T[];
}

// ==================== Hover / Interaction State ====================

/**
 * Tracks the hover and interaction state of a message bubble.
 */
export interface BubbleInteractionState {
  isHovered: boolean;
  isOptionsOpen: boolean;
  isFocused: boolean;
}

// ==================== Moderation State ====================

/**
 * Possible moderation statuses for a message.
 */
export type ModerationStatus = 'pending' | 'approved' | 'disapproved' | 'none';

// ==================== Constants ====================

/**
 * Default number of quick-access options shown directly on the bubble.
 * Additional options go into the overflow menu.
 */
export const DEFAULT_QUICK_OPTIONS_COUNT = 3;

/**
 * Delay before showing hover options (ms) — prevents flicker on fast mouse moves.
 */
export const HOVER_SHOW_DELAY_MS = 100;

/**
 * Delay before hiding hover options after mouse leave (ms).
 */
export const HOVER_HIDE_DELAY_MS = 300;
