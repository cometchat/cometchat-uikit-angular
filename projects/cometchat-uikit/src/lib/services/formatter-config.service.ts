import { Injectable } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../formatters/cometchat-mentions-formatter';
import { CometChatUrlFormatter } from '../formatters/cometchat-url-formatter';
import { CometChatMarkdownFormatter } from '../formatters/cometchat-markdown-formatter';
import { MessageBubbleAlignment } from '../Enums/Enums';

/**
 * FormatterConfigService
 *
 * Centralized service for managing default text formatters across the CometChat Angular UIKit.
 *
 * ## Overview
 *
 * This service provides a single source of truth for text formatters used throughout the application.
 * It allows developers to configure formatters once and have them automatically applied across all
 * text-displaying components (text bubbles, conversation items, previews, etc.).
 *
 * ## Architecture
 *
 * The service implements a singleton pattern with `providedIn: 'root'`, ensuring a single instance
 * is shared across the entire application. It stores formatter instances and reuses them for
 * performance optimization.
 *
 * ### Key Features
 *
 * - **Default Formatters**: Provides mentions and URL formatters by default
 * - **Customization**: Supports setting custom formatters to replace defaults
 * - **Extension**: Supports adding additional formatters to the default set
 * - **Context Configuration**: Configures formatters with logged-in user and alignment
 * - **Performance**: Reuses formatter instances across components
 * - **Type-safe**: Full TypeScript support with CometChat SDK types
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Use Default Formatters (Recommended)
 *
 * ```typescript
 * export class MyComponent {
 *   private formatterConfig = inject(FormatterConfigService);
 *
 *   ngOnInit() {
 *     // Get default formatters (mentions + URLs)
 *     this.formatters = this.formatterConfig.getDefaultFormatters();
 *   }
 * }
 * ```
 *
 * ### Pattern 2: Set Custom Formatters Globally
 *
 * ```typescript
 * // In app initialization (main.ts or app.component.ts)
 * export class AppComponent implements OnInit {
 *   private formatterConfig = inject(FormatterConfigService);
 *
 *   ngOnInit() {
 *     // Replace defaults with custom formatters
 *     const customFormatters = [
 *       new MyCustomMentionsFormatter(),
 *       new MyCustomUrlFormatter(),
 *       new HashtagFormatter()
 *     ];
 *     this.formatterConfig.setDefaultFormatters(customFormatters);
 *   }
 * }
 * ```
 *
 * ### Pattern 3: Add Formatters to Defaults
 *
 * ```typescript
 * export class AppComponent implements OnInit {
 *   private formatterConfig = inject(FormatterConfigService);
 *
 *   ngOnInit() {
 *     // Keep default formatters, add custom ones
 *     const additionalFormatters = [
 *       new HashtagFormatter(),
 *       new EmailFormatter()
 *     ];
 *     this.formatterConfig.addFormatters(additionalFormatters);
 *   }
 * }
 * ```
 *
 * ### Pattern 4: Get Formatters with Context
 *
 * ```typescript
 * export class MessageListComponent {
 *   private formatterConfig = inject(FormatterConfigService);
 *
 *   ngOnInit() {
 *     const loggedInUser = CometChat.getLoggedInUser();
 *     const alignment = MessageBubbleAlignment.left;
 *
 *     // Get formatters configured with context
 *     this.formatters = this.formatterConfig.getFormattersWithContext(
 *       loggedInUser,
 *       alignment
 *     );
 *   }
 * }
 * ```
 *
 * ### Pattern 5: Reset to Defaults
 *
 * ```typescript
 * export class SettingsComponent {
 *   private formatterConfig = inject(FormatterConfigService);
 *
 *   resetFormatters() {
 *     // Reset to built-in defaults (mentions + URLs)
 *     this.formatterConfig.resetToDefaults();
 *   }
 * }
 * ```
 *
 * ## Default Behavior
 *
 * When no custom formatters are configured, the service returns:
 * - **CometChatMentionsFormatter** (priority 20) - Detects and formats @mentions
 * - **CometChatUrlFormatter** (priority 100) - Detects and formats URLs
 *
 * These formatters are singleton instances, reused across all components for performance.
 *
 * ## Formatter Priority
 *
 * Formatters are applied in order of their priority property (lower = earlier in pipeline):
 * - Mentions formatter: priority 20 (executes first)
 * - URL formatter: priority 100 (executes after mentions)
 *
 * Custom formatters can use any priority value to control execution order.
 *
 * @Injectable providedIn: 'root'
 *
 * ## Multiple Instances (Scoping)
 *
 * This service is `providedIn: 'root'` (singleton by default). All components share
 * the same formatter configuration. If you need different formatters for different
 * message lists (e.g., main chat vs. thread panel), create a wrapper component that
 * provides its own instance:
 *
 * ```typescript
 * @Component({
 *   selector: 'app-thread-panel',
 *   providers: [FormatterConfigService], // Scoped instance
 *   template: `<cometchat-message-list ...></cometchat-message-list>`
 * })
 * export class ThreadPanelComponent {
 *   private formatterConfig = inject(FormatterConfigService); // Local instance
 * }
 * ```
 *
 * @see Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6

 */
@Injectable({
  providedIn: 'root',
})
export class FormatterConfigService {
  // ==================== Private State ====================

  /**
   * Singleton instances of default formatters.
   * These are created once and reused across all components for performance.
   * @private
   */
  private defaultMentionsFormatter: CometChatMentionsFormatter | null = null;
  private defaultMarkdownFormatter: CometChatMarkdownFormatter | null = null;
  private defaultUrlFormatter: CometChatUrlFormatter | null = null;

  /**
   * Custom formatters set by the developer.
   * When set, these replace the default formatters.
   * @private
   */
  private customFormatters: CometChatTextFormatter[] | null = null;

  /**
   * Additional formatters to add to the default set.
   * These are combined with default formatters when retrieved.
   * @private
   */
  private additionalFormatters: CometChatTextFormatter[] = [];

  constructor() {
    // Service is ready to use immediately
    // Formatters are created lazily on first access
  }

  // ==================== Public Methods ====================

  /**
   * Get the default text formatters.
   *
   * Returns the configured formatters in the following priority:
   * 1. Custom formatters (if set via setDefaultFormatters)
   * 2. Default formatters + additional formatters (if added via addFormatters)
   * 3. Built-in defaults (mentions + URLs)
   *
   * The returned formatters are singleton instances, reused across components
   * for performance optimization.
   *
   * @returns Array of text formatters to apply
   * @see Requirements 11.1, 11.2, 11.3, 11.6
   *
   * @example
   * ```typescript
   * // Get default formatters in a component
   * export class TextBubbleComponent {
   *   private formatterConfig = inject(FormatterConfigService);
   *
   *   ngOnInit() {
   *     this.formatters = this.formatterConfig.getDefaultFormatters();
   *   }
   * }
   * ```
   */
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

  /**
   * Add additional formatters to the default set.
   *
   * This method adds the provided formatters to the built-in defaults
   * (mentions + URLs) without replacing them. The additional formatters
   * will be combined with the defaults when getDefaultFormatters() is called.
   *
   * If custom formatters have been set via setDefaultFormatters(), this
   * method has no effect (custom formatters take precedence).
   *
   * @param formatters - Array of formatters to add to the defaults
   * @see Requirements 11.5
   *
   * @example
   * ```typescript
   * // Add custom formatters to defaults
   * const additionalFormatters = [
   *   new HashtagFormatter(),
   *   new EmailFormatter()
   * ];
   * this.formatterConfig.addFormatters(additionalFormatters);
   *
   * // Now getDefaultFormatters() returns:
   * // [mentions, URLs, hashtag, email]
   * ```
   */
  addFormatters(formatters: CometChatTextFormatter[]): void {
    if (!formatters) return;
    this.additionalFormatters.push(...formatters);
  }

  /**
   * Reset to built-in default formatters.
   *
   * This method clears any custom formatters set via setDefaultFormatters()
   * and any additional formatters added via addFormatters(), returning to
   * the built-in defaults (mentions + URLs).
   *
   * @see Requirements 11.6
   *
   * @example
   * ```typescript
   * // Reset to built-in defaults
   * this.formatterConfig.resetToDefaults();
   *
   * // Now getDefaultFormatters() returns:
   * // [mentions, URLs]
   * ```
   */
  resetToDefaults(): void {
    this.customFormatters = null;
    this.additionalFormatters = [];
  }

  /**
   * Get formatters configured with context (logged-in user and alignment).
   *
   * This method returns the default formatters with context configuration applied:
   * - Mentions formatter is configured with the logged-in user for self-mention detection
   * - Mentions formatter is configured with message bubble alignment for direction CSS classes
   *
   * The context configuration allows formatters to apply the correct CSS classes:
   * - Self-mention: `cometchat-mentions-you`
   * - Other-mention: `cometchat-mentions-other`
   * - Incoming: `cometchat-mentions-incoming` (when alignment is left)
   * - Outgoing: `cometchat-mentions-outgoing` (when alignment is right)
   *
   * When alignment is undefined (e.g., in composer or conversation subtitle),
   * no direction CSS classes are applied.
   *
   * @param loggedInUser - The logged-in user for self-mention detection (optional)
   * @param alignment - The message bubble alignment for direction CSS classes (optional)
   * @returns Array of formatters configured with the provided context
   * @see Requirements 11.2, 11.3
   *
   * @example
   * ```typescript
   * // Get formatters with context in message list
   * export class MessageListComponent {
   *   private formatterConfig = inject(FormatterConfigService);
   *
   *   ngOnInit() {
   *     const loggedInUser = CometChat.getLoggedInUser();
   *     const alignment = this.getMessageAlignment(message);
   *
   *     this.formatters = this.formatterConfig.getFormattersWithContext(
   *       loggedInUser,
   *       alignment
   *     );
   *   }
   * }
   *
   * // Get formatters without alignment (for composer)
   * export class MessageComposerComponent {
   *   private formatterConfig = inject(FormatterConfigService);
   *
   *   ngOnInit() {
   *     const loggedInUser = CometChat.getLoggedInUser();
   *
   *     // No alignment = no direction CSS classes
   *     this.formatters = this.formatterConfig.getFormattersWithContext(
   *       loggedInUser,
   *       undefined
   *     );
   *   }
   * }
   * ```
   */
  getFormattersWithContext(
    loggedInUser?: CometChat.User,
    alignment?: MessageBubbleAlignment
  ): CometChatTextFormatter[] {
    const formatters = this.getDefaultFormatters();

    // Clone formatters to avoid shared state between components
    const clonedFormatters = formatters.map(formatter => {
      if (formatter instanceof CometChatMentionsFormatter) {
        const cloned = new CometChatMentionsFormatter();
        // Copy configuration from original
        if (loggedInUser) {
          cloned.setLoggedInUser(loggedInUser);
        }
        if (alignment !== undefined) {
          cloned.setMessageBubbleAlignment(alignment);
        } else {
          // Clear alignment for contexts like composer or conversation subtitle
          cloned.setMessageBubbleAlignment(undefined);
        }
        return cloned;
      }
      // Return other formatters as-is (they don't have state that varies by context)
      return formatter;
    });

    return clonedFormatters;
  }

  // ==================== Private Methods ====================

  /**
   * Get the built-in default formatters (mentions + markdown + URLs).
   *
   * Creates singleton instances on first access and reuses them for performance.
   * The formatters use their configured priorities as defined in their respective classes.
   *
   * @returns Array of built-in default formatters
   * @private
   */
  private getBuiltInDefaults(): CometChatTextFormatter[] {
    // Create singleton instances on first access
    if (!this.defaultMentionsFormatter) {
      this.defaultMentionsFormatter = new CometChatMentionsFormatter();
    }

    if (!this.defaultMarkdownFormatter) {
      this.defaultMarkdownFormatter = new CometChatMarkdownFormatter();
    }

    if (!this.defaultUrlFormatter) {
      this.defaultUrlFormatter = new CometChatUrlFormatter();
    }

    return [this.defaultMentionsFormatter, this.defaultMarkdownFormatter, this.defaultUrlFormatter];
  }
}
