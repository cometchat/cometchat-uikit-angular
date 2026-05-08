/**
 * Types and interfaces for CometChatTextBubble component.
 */

/**
 * Link Preview Data Structure
 *
 * Represents the data extracted from message metadata for displaying
 * rich link preview cards.
 */
export interface LinkPreviewData {
  /** The URL of the link */
  url: string;
  /** The title of the linked page (optional) */
  title?: string;
  /** A description of the linked page (optional) */
  description?: string;
  /** The URL of a preview image (optional) */
  image?: string;
  /** The URL of the favicon (optional) */
  favicon?: string;
}
