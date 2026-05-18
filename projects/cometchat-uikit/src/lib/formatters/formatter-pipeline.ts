import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter, TextFormatterContext } from './cometchat-text-formatter';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Result of applying the formatter pipeline.
 * Contains the formatted text and combined metadata from all formatters.
 */
export interface FormatterPipelineResult {
  /** The final formatted text after all formatters have been applied */
  text: string;
  /** Combined metadata from all formatters */
  metadata: Record<string, unknown>;
  /** Array of formatter IDs that were successfully applied */
  appliedFormatters: string[];
  /** Array of formatter IDs that encountered errors */
  failedFormatters: string[];
}

/**
 * Apply a pipeline of text formatters to the given text.
 *
 * This function:
 * 1. Sorts formatters by priority (lower priority number = earlier in pipeline)
 * 2. Applies each formatter's format() method in sequence
 * 3. Catches any errors from individual formatters and continues with the next one
 * 4. Returns the final formatted text along with combined metadata
 *
 * Formatters are applied in order of their `priority` property. Each formatter
 * receives the output of the previous formatter as its input. If a formatter
 * throws an error, the error is logged and the original text (from the previous
 * formatter) is passed to the next formatter.
 *
 * @param formatters - Array of CometChatTextFormatter instances to apply
 * @param text - The text to format
 * @param message - The message containing the text (optional, for context)
 * @param context - Additional context for formatters (optional)
 * @returns FormatterPipelineResult containing formatted text and metadata
 *
 * @example
 * ```typescript
 * const formatters = [
 *   new CometChatUrlFormatter(),      // priority: 10
 *   new CometChatMentionsFormatter(), // priority: 20
 *   new CometChatEmojiFormatter(),    // priority: 30
 * ];
 *
 * const result = applyFormatters(formatters, 'Hello @john :smile: https://example.com');
 * // result.text contains formatted HTML with links, mentions, and emoji
 * // result.metadata contains { urls: [...], mentions: [...], shortcodes: [...] }
 * ```
 *
 * @see Requirements 5.2, 5.4, 5.6
 */
export function applyFormatters(
  formatters: CometChatTextFormatter[],
  text: string,
  message?: CometChat.BaseMessage,
  context?: TextFormatterContext
): FormatterPipelineResult {
  // Handle empty or null inputs
  if (!formatters || formatters.length === 0) {
    return {
      text,
      metadata: {},
      appliedFormatters: [],
      failedFormatters: [],
    };
  }

  if (!text) {
    return {
      text: text ?? '',
      metadata: {},
      appliedFormatters: [],
      failedFormatters: [],
    };
  }

  // Sort formatters by priority (lower = earlier in pipeline)
  // Create a copy to avoid mutating the original array
  const sortedFormatters = [...formatters].sort((a, b) => a.priority - b.priority);

  let currentText = text;
  const combinedMetadata: Record<string, unknown> = {};
  const appliedFormatters: string[] = [];
  const failedFormatters: string[] = [];

  // Apply each formatter in sequence
  for (const formatter of sortedFormatters) {
    try {
      // Reset formatter state before applying
      formatter.reset();

      // Check if formatter should process this text
      if (!formatter.shouldFormat(currentText, message)) {
        continue;
      }

      // Apply the formatter
      currentText = formatter.format(currentText);

      // Collect metadata from this formatter
      const formatterMetadata = formatter.getMetadata();
      Object.assign(combinedMetadata, formatterMetadata);

      // Track successful application
      appliedFormatters.push(formatter.id);
    } catch (error) {
      // Log the error but continue with the next formatter
      // The original text (from previous formatter) is preserved
      CometChatLogger.warn('FormatterPipeline', `Formatter "${formatter.id}" encountered an error:`, error instanceof Error ? error.message : error);

      // Track failed formatter
      failedFormatters.push(formatter.id);

      // Continue with the current text (unchanged by this formatter)
    }
  }

  return {
    text: currentText,
    metadata: combinedMetadata,
    appliedFormatters,
    failedFormatters,
  };
}

/**
 * Apply a pipeline of text formatters and return only the formatted text.
 *
 * This is a convenience function that wraps `applyFormatters` and returns
 * only the formatted text string, discarding metadata and tracking info.
 *
 * @param formatters - Array of CometChatTextFormatter instances to apply
 * @param text - The text to format
 * @param message - The message containing the text (optional)
 * @param context - Additional context for formatters (optional)
 * @returns The formatted text string
 *
 * @see Requirements 5.2, 5.4, 5.6
 */
export function formatText(
  formatters: CometChatTextFormatter[],
  text: string,
  message?: CometChat.BaseMessage,
  context?: TextFormatterContext
): string {
  return applyFormatters(formatters, text, message, context).text;
}
