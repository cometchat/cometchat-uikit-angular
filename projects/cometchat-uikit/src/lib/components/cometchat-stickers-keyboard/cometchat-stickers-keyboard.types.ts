/**
 * Types and interfaces for CometChatStickersKeyboard component.
 */

/**
 * Event emitted when a sticker is clicked
 */
export interface StickerClickEvent {
  /** URL of the selected sticker */
  stickerUrl: string;
  /** Name of the selected sticker */
  stickerName: string;
}

/**
 * Represents a single sticker item
 */
export interface StickerItem {
  /** URL of the sticker image */
  stickerUrl: string;
  /** Name of the sticker set this sticker belongs to */
  stickerSetName: string;
  /** Order of the sticker within its set */
  stickerOrder?: number;
}

/**
 * Represents a collection of sticker sets
 */
export type StickerSet = Record<string, StickerItem[]>;

/**
 * Component state enum for managing loading/error/empty states
 */
export type ComponentState = 'loading' | 'loaded' | 'error' | 'empty';
