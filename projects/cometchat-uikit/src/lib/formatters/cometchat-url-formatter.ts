import { CometChatTextFormatter } from './cometchat-text-formatter';

/**
 * Formatter for URLs in text.
 *
 * Detects URL patterns (http://, https://, www.) in text and converts them
 * to clickable links. URLs are opened in a new tab with security attributes.
 *
 * @example
 * ```typescript
 * const formatter = new CometChatUrlFormatter();
 *
 * // Format text with URLs
 * const formatted = formatter.format('Check out https://example.com for more info');
 *
 * // Get detected URLs
 * const urls = formatter.getUrls();
 * // ['https://example.com']
 * ```
 *
 * @see Requirements 23.1-23.5
 */
export class CometChatUrlFormatter extends CometChatTextFormatter {
  /**
   * Unique identifier for this formatter.
   * @see Requirements 5.1
   */
  readonly id = 'url-formatter';

  /**
   * Formatter priority (lower = earlier in pipeline).
   * URLs are processed with priority 10 (before mentions).
   * @see Requirements 5.5
   */
  override priority = 10;

  /**
   * Array of detected URLs from the last format() call
   * @private
   */
  private urls: string[] = [];

  /**
   * Get the regex pattern for detecting URLs.
   *
   * Matches:
   * - http:// or https:// followed by non-whitespace characters
   * - www. followed by non-whitespace characters
   *
   * The pattern uses the global and case-insensitive flags.
   *
   * @returns RegExp pattern for URL detection
   */
  getRegex(): RegExp {
    return /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  }

  /**
   * Format the input text by detecting URLs and converting them to links.
   *
   * This method:
   * 1. Stores the original text
   * 2. Detects all URL patterns
   * 3. Converts URLs to clickable anchor tags
   * 4. Stores detected URLs in metadata
   * 5. Returns formatted text with clickable links
   *
   * Links are created with:
   * - target="_blank" to open in new tab
   * - rel="noopener noreferrer" for security
   * - class="cometchat-link" for styling
   *
   * @param text - The text to format
   * @returns The formatted text with clickable links
   */
  format(text: string): string {
    if (text == null) {
      this.originalText = '';
      this.formattedText = '';
      this.urls = [];
      this.metadata = { urls: this.urls };
      return '';
    }

    this.originalText = text;
    this.urls = [];

    // Protect markdown links [text](url) from being double-processed.
    // Replace them with placeholders, process bare URLs, then restore.
    const markdownLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const placeholders: string[] = [];
    let protectedText = text.replace(markdownLinkRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00MDLINK${idx}\x00`;
    });

    // Also protect URLs already wrapped in <a> tags (from previous formatters)
    const existingLinkRegex = /<a\s[^>]*href="[^"]*"[^>]*>[^<]*<\/a>/gi;
    protectedText = protectedText.replace(existingLinkRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00MDLINK${idx}\x00`;
    });

    // Now process bare URLs in the remaining text
    this.formattedText = protectedText.replace(this.getRegex(), match => {
      // Clean trailing punctuation that's likely not part of the URL
      const cleaned = match.replace(/[).,;:!?]+$/, '');
      const trailing = match.slice(cleaned.length);

      this.urls.push(cleaned);

      const href = cleaned.startsWith('www.') ? `https://${cleaned}` : cleaned;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cometchat-link">${cleaned}</a>${trailing}`;
    });

    // Restore markdown link placeholders
    this.formattedText = this.formattedText.replace(/\x00MDLINK(\d+)\x00/g, (_, idx) => {
      return placeholders[parseInt(idx, 10)];
    });

    this.metadata = { urls: this.urls };
    return this.formattedText;
  }

  /**
   * Get the array of detected URLs from the last format() call.
   *
   * @returns Array of URL strings detected in the text
   */
  getUrls(): string[] {
    return [...this.urls];
  }

  /**
   * Check if the text contains any URLs.
   *
   * @returns true if URLs were detected, false otherwise
   */
  hasUrls(): boolean {
    return this.urls.length > 0;
  }

  /**
   * Reset the formatter state to initial values.
   *
   * Clears original text, formatted text, metadata, and detected URLs.
   */
  override reset(): void {
    super.reset();
    this.urls = [];
  }
}
