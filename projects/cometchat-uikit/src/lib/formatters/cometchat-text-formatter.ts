import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Context object for text formatters.
 * Provides additional information that formatters may need during processing.
 *
 * @see Requirements 5.1, 5.5
 */
export interface TextFormatterContext {
  /** The logged-in user */
  loggedInUser?: CometChat.User;
  /** The group (if applicable) */
  group?: CometChat.Group;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for text formatters
 *
 * Formatters detect patterns in text and apply formatting transformations.
 * Text formatters are used to detect and transform patterns in text content,
 * such as @mentions, URLs, or custom patterns. They can be chained together
 * to apply multiple transformations in sequence.
 *
 * Formatters are applied in order of their priority property (lower = earlier in pipeline).
 * Each formatter can optionally implement shouldFormat() to conditionally skip processing.
 *
 * @abstract
 * @see Requirements 5.1, 5.5, 21.1-21.7
 *
 * @example
 * ```typescript
 * class MyFormatter extends CometChatTextFormatter {
 *   readonly id = 'my-formatter';
 *   priority = 50;
 *
 *   getRegex(): RegExp {
 *     return /pattern/g;
 *   }
 *
 *   format(text: string): string {
 *     return text.replace(this.getRegex(), 'replacement');
 *   }
 *
 *   shouldFormat(text: string, message?: CometChat.BaseMessage): boolean {
 *     return text.includes('pattern');
 *   }
 * }
 * ```
 */
export abstract class CometChatTextFormatter {
  /**
   * Formatter priority (lower = earlier in pipeline).
   * Formatters are sorted by priority before being applied.
   * Default is 100.
   *
   * @see Requirements 5.5
   */
  priority = 100;

  /**
   * Unique identifier for this formatter.
   * Used for debugging and to identify formatters in the pipeline.
   * Subclasses should provide a unique, descriptive id.
   *
   * @abstract
   * @see Requirements 5.1
   */
  abstract readonly id: string;

  /**
   * The original unformatted text
   * @protected
   */
  protected originalText = '';

  /**
   * The formatted text after applying transformations
   * @protected
   */
  protected formattedText = '';

  /**
   * Metadata extracted during formatting (e.g., mentions, URLs)
   * @protected
   */
  protected metadata: Record<string, unknown> = {};

  /**
   * Get the regex pattern for this formatter.
   * This pattern is used to detect the text patterns that should be formatted.
   *
   * @abstract
   * @returns The RegExp pattern for detecting formattable content
   */
  abstract getRegex(): RegExp;

  /**
   * Format the input text by applying transformations.
   *
   * Implementations should:
   * 1. Store the original text in this.originalText
   * 2. Apply transformations and store result in this.formattedText
   * 3. Extract any metadata and store in this.metadata
   * 4. Return the formatted text
   *
   * @abstract
   * @param text - The text to format
   * @returns The formatted text with transformations applied
   */
  abstract format(text: string): string;

  /**
   * Get the formatted text after format() has been called.
   *
   * @returns The formatted text, or empty string if format() hasn't been called
   */
  getFormattedText(): string {
    return this.formattedText;
  }

  /**
   * Get the original unformatted text.
   *
   * @returns The original text before formatting, or empty string if format() hasn't been called
   */
  getOriginalText(): string {
    return this.originalText;
  }

  /**
   * Get metadata extracted during formatting.
   *
   * Metadata can include information like detected mentions, URLs, or other
   * pattern-specific data that was extracted during the format() operation.
   *
   * @returns A record containing formatter-specific metadata
   */
  getMetadata(): Record<string, unknown> {
    return this.metadata;
  }

  /**
   * Reset the formatter state to initial values.
   *
   * This clears the original text, formatted text, and metadata.
   * Call this method before reusing a formatter instance for new text.
   */
  reset(): void {
    this.originalText = '';
    this.formattedText = '';
    this.metadata = {};
  }

  /**
   * Check if this formatter should process the given text.
   *
   * Override this method to conditionally skip formatting based on
   * the text content or message properties. By default, returns true
   * to always apply formatting.
   *
   * @param text - The text to check
   * @param message - The message containing the text (optional)
   * @returns Whether to apply this formatter (default: true)
   * @see Requirements 5.1
   *
   * @example
   * ```typescript
   * // Skip formatting for very short messages
   * shouldFormat(text: string, message?: CometChat.BaseMessage): boolean {
   *   return text.length > 10;
   * }
   *
   * // Skip formatting for certain message types
   * shouldFormat(text: string, message?: CometChat.BaseMessage): boolean {
   *   return message?.getType() !== 'custom';
   * }
   * ```
   */
  shouldFormat(text: string, message?: CometChat.BaseMessage): boolean {
    return true;
  }
}
