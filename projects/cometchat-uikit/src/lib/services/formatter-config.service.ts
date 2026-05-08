import { Injectable } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../formatters/cometchat-mentions-formatter';
import { CometChatUrlFormatter } from '../formatters/cometchat-url-formatter';
import { CometChatMarkdownFormatter } from '../formatters/cometchat-markdown-formatter';
import { MessageBubbleAlignment } from '../Enums/Enums';

/**
 * FormatterConfigService manages default text formatters (mentions, markdown, URLs).
 * Singleton by default. Supports custom formatters, additional formatters, and context configuration.
 * @Injectable providedIn: 'root'
 * @see Requirements 11.1-11.6
 */
@Injectable({
  providedIn: 'root',
})
export class FormatterConfigService {
  private defaultMentionsFormatter: CometChatMentionsFormatter | null = null;
  private defaultMarkdownFormatter: CometChatMarkdownFormatter | null = null;
  private defaultUrlFormatter: CometChatUrlFormatter | null = null;
  private customFormatters: CometChatTextFormatter[] | null = null;
  private additionalFormatters: CometChatTextFormatter[] = [];

  constructor() {}

  /** Get the default text formatters. @see Requirements 11.1-11.3, 11.6 */
  getDefaultFormatters(): CometChatTextFormatter[] {
    // If custom formatters are set, return them
    if (this.customFormatters !== null) {
      return [...this.customFormatters];
    }

    // Otherwise, return built-in defaults + additional formatters
    const defaults = this.getBuiltInDefaults();
    return [...defaults, ...this.additionalFormatters];
  }

  /**
   * Set custom formatters to replace the defaults.
   *
   * This method replaces the built-in default formatters (mentions + URLs)
   * with the provided custom formatters. The custom formatters will be used
   * by all components that call getDefaultFormatters().
   *
   * To reset to built-in defaults, call resetToDefaults().
   *
   * @param formatters - Array of custom formatters to use as defaults
   * @see Requirements 11.4
   *
   * @example
   * ```typescript
   * // Replace defaults with custom formatters
   * const customFormatters = [
   *   new MyCustomMentionsFormatter(),
   *   new MyCustomUrlFormatter(),
   *   new HashtagFormatter()
   * ];
   * this.formatterConfig.setDefaultFormatters(customFormatters);
   * ```
   */
  setDefaultFormatters(formatters: CometChatTextFormatter[]): void {
    this.customFormatters = formatters ? [...formatters] : [];
  }

  /** Add additional formatters to the default set. @see Requirements 11.5 */
  addFormatters(formatters: CometChatTextFormatter[]): void {
    if (!formatters) return;
    this.additionalFormatters.push(...formatters);
  }

  /** Reset to built-in default formatters. @see Requirements 11.6 */
  resetToDefaults(): void {
    this.customFormatters = null;
    this.additionalFormatters = [];
  }

  /** Get formatters configured with logged-in user and alignment context. @see Requirements 11.2, 11.3 */
  getFormattersWithContext(loggedInUser?: CometChat.User, alignment?: MessageBubbleAlignment): CometChatTextFormatter[] {
    const formatters = this.getDefaultFormatters();

    return formatters.map(formatter => {
      if (formatter instanceof CometChatMentionsFormatter) {
        const cloned = new CometChatMentionsFormatter();
        if (loggedInUser) cloned.setLoggedInUser(loggedInUser);
        cloned.setMessageBubbleAlignment(alignment !== undefined ? alignment : undefined);
        return cloned;
      }
      return formatter;
    });
  }

  private getBuiltInDefaults(): CometChatTextFormatter[] {
    if (!this.defaultMentionsFormatter) this.defaultMentionsFormatter = new CometChatMentionsFormatter();
    if (!this.defaultMarkdownFormatter) this.defaultMarkdownFormatter = new CometChatMarkdownFormatter();
    if (!this.defaultUrlFormatter) this.defaultUrlFormatter = new CometChatUrlFormatter();
    return [this.defaultMentionsFormatter, this.defaultMarkdownFormatter, this.defaultUrlFormatter];
  }
}
