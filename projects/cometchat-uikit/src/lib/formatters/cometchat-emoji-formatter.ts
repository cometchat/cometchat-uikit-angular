import { CometChatTextFormatter } from './cometchat-text-formatter';
import { EMOJI_MAP, EMOJI_SHORTCODE_REGEX } from './cometchat-emoji-formatter.constants';

// Re-export constants for backward compatibility
export { EMOJI_MAP, EMOJI_SHORTCODE_REGEX } from './cometchat-emoji-formatter.constants';

/**
 * Formatter for emoji shortcodes in text.
 *
 * Detects emoji shortcode patterns (e.g., :smile:, :heart:) in text and converts
 * them to their corresponding Unicode emoji characters.
 *
 * @example
 * ```typescript
 * const formatter = new CometChatEmojiFormatter();
 * const formatted = formatter.format('Hello :smile: how are you :heart:');
 * // Result: 'Hello 😊 how are you ❤️'
 * ```
 */
export class CometChatEmojiFormatter extends CometChatTextFormatter {
  readonly id = 'emoji-formatter';
  override priority = 30;

  private shortcodes: string[] = [];
  private customEmojiMap: Record<string, string> = {};

  /** Returns the regex pattern for detecting emoji shortcodes. */
  getRegex(): RegExp {
    return new RegExp(EMOJI_SHORTCODE_REGEX.source, 'g');
  }

  /**
   * Formats text by replacing emoji shortcodes with Unicode emoji characters.
   * Unrecognized shortcodes are left unchanged.
   */
  format(text: string): string {
    if (text == null) {
      this.originalText = '';
      this.formattedText = '';
      this.metadata = { shortcodes: [] };
      return '';
    }
    this.originalText = text;
    this.shortcodes = [];
    this.formattedText = text.replace(this.getRegex(), (match, shortcode) => {
      const lower = shortcode.toLowerCase();
      const emoji = this.customEmojiMap[lower] || EMOJI_MAP[lower];
      if (emoji) { this.shortcodes.push(shortcode); return emoji; }
      return match;
    });
    this.metadata = { shortcodes: this.shortcodes };
    return this.formattedText;
  }

  /** Returns detected shortcodes from the last format() call. */
  getShortcodes(): string[] { return [...this.shortcodes]; }

  /** Returns true if shortcodes were detected and converted. */
  hasShortcodes(): boolean { return this.shortcodes.length > 0; }

  /**
   * Adds custom emoji shortcodes. Custom shortcodes take precedence over built-in ones.
   * @param emojiMap - Record mapping shortcode names to emoji characters
   */
  addCustomEmoji(emojiMap: Record<string, string>): void {
    this.customEmojiMap = { ...this.customEmojiMap, ...emojiMap };
  }

  /** Clears all custom emoji shortcodes. */
  clearCustomEmoji(): void { this.customEmojiMap = {}; }

  /**
   * Returns the emoji for a specific shortcode (without colons).
   * @returns The emoji character or undefined if not found
   */
  getEmoji(shortcode: string): string | undefined {
    const lower = shortcode.toLowerCase();
    return this.customEmojiMap[lower] || EMOJI_MAP[lower];
  }

  /**
   * Returns true if the shortcode is recognized (built-in or custom).
   */
  isValidShortcode(shortcode: string): boolean {
    const lower = shortcode.toLowerCase();
    return lower in this.customEmojiMap || lower in EMOJI_MAP;
  }

  override reset(): void {
    super.reset();
    this.shortcodes = [];
  }
}
