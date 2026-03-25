/**
 * Rich Text Editor Interfaces
 *
 * Type definitions for the custom rich text editor.
 * These interfaces define the API for the RichTextEditorService.
 *
 * @module services/rich-text-editor
 * @see Requirements 12.1, 12.2, 12.3, 12.4
 */

/**
 * Interface for rich text formatting state
 * Tracks which formatting options are currently active
 */
export interface RichTextFormatState {
  /** Whether bold formatting is active */
  bold: boolean;
  /** Whether italic formatting is active */
  italic: boolean;
  /** Whether underline formatting is active */
  underline: boolean;
  /** Whether strikethrough formatting is active */
  strikethrough: boolean;
  /** Whether code (inline) formatting is active */
  code: boolean;
  /** Whether blockquote formatting is active */
  blockquote: boolean;
  /** Whether code block formatting is active */
  codeBlock: boolean;
  /** Whether ordered list formatting is active */
  orderedList: boolean;
  /** Whether bullet list formatting is active */
  bulletList: boolean;
  /** Whether a link is active */
  link: boolean;
}

/**
 * Interface for mention items
 */
export interface MentionItem {
  /** Unique identifier */
  id: string;
  /** Display name */
  label: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether this is the @all mention */
  isAllMention?: boolean;
  /** Original entity (User or GroupMember) */
  entity?: unknown;
}

/**
 * Interface for rich text editor configuration options
 */
export interface RichTextEditorConfig {
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor should be editable */
  editable?: boolean;
  /** Whether to autofocus the editor on creation */
  autofocus?: boolean | 'start' | 'end' | 'all' | number;
  /** Initial content for the editor (HTML string) */
  content?: string;
  /** ARIA label for accessibility (defaults to 'Rich text editor') */
  ariaLabel?: string;
  /** Whether to enable rich text formatting (when false, strips all formatting on paste) */
  enableFormatting?: boolean;
  /** Callback when editor content changes */
  onUpdate?: (html: string, text: string) => void;
  /** Callback when editor selection changes */
  onSelectionUpdate?: (formatState: RichTextFormatState) => void;
  /** Callback when editor is focused */
  onFocus?: () => void;
  /** Callback when editor loses focus */
  onBlur?: () => void;
  /** Callback when a link is clicked (for editing) - includes click coordinates */
  onLinkClick?: (url: string, text: string, x: number, y: number) => void;
  /** Callback when @ is typed to trigger mention suggestions */
  onMentionStart?: (query: string) => void;
  /** Callback when mention suggestions should be hidden */
  onMentionEnd?: () => void;
  /** Callback to get mention suggestions - returns items for the suggestion popup */
  getMentionSuggestions?: (query: string) => Promise<MentionItem[]>;
  /** Callback when a mention is selected */
  onMentionSelect?: (item: MentionItem) => void;
}

/**
 * Interface for rich text message metadata
 * Included in messages sent with rich text formatting
 */
export interface RichTextMetadata {
  /** The HTML content of the message */
  html: string;
  /** The plain text content of the message */
  plainText: string;
  /** Whether the message contains rich text formatting */
  hasFormatting: boolean;
}

/**
 * Interface for saved selection state
 * Used to restore cursor position after operations
 */
export interface SelectionState {
  /** Anchor node of the selection */
  anchorNode: Node | null;
  /** Offset within the anchor node */
  anchorOffset: number;
  /** Focus node of the selection */
  focusNode: Node | null;
  /** Offset within the focus node */
  focusOffset: number;
}

/**
 * Interface for history entries
 * Used for undo/redo functionality
 */
export interface HistoryEntry {
  /** HTML content at this point in history */
  html: string;
  /** Cursor position at this point in history */
  cursorPosition: number;
  /** Timestamp when this entry was created */
  timestamp: number;
}
