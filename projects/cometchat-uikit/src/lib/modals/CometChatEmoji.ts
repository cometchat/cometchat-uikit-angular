/**
 * Represents a single emoji with its character representation.
 * It is used in CometChatEmojiKeyboard component.
 */
export interface CometChatEmoji {
  /** The emoji character. */
  char: string;

  /** Keywords for search filtering. */
  keywords?: string[];
}

/**
 * Represents a category of emojis with its metadata and emoji collection.
 * It is used in CometChatEmojiKeyboard component.
 */
export interface CometChatEmojiCategory {
  /** Unique identifier for the emoji category. */
  id: string;

  /** Localization key for the category name. */
  name: string;

  /** Icon URL for the category tab. */
  symbolURL: string;

  /**
   * Object map of emojis keyed by emoji name.
   * Note: Uses 'emojies' to match React UIKit naming convention.
   */
  emojies: Record<string, CometChatEmoji>;
}
