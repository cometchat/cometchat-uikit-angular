import { Injectable } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageTypeKey } from './message-bubble-config.service';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Callback type for formatting a message into subtitle text.
 *
 * @param message - The CometChat message to format
 * @returns The formatted subtitle string
 */
export type SubtitleFormatter = (message: CometChat.BaseMessage) => string;

/**
 * ConversationSubtitleService
 *
 * Manages custom subtitle text and icon overrides for conversation items
 * based on message type/category combinations.
 *
 * Developers can register formatters to control the last message text shown
 * in conversation list items for specific message types, and override the
 * subtitle icon displayed alongside the text.
 *
 * @example
 * ```typescript
 * const subtitleService = inject(ConversationSubtitleService);
 *
 * // Register a subtitle formatter for location messages
 * subtitleService.registerSubtitleFormatter('location_custom', (message) => {
 *   const data = (message as CometChat.CustomMessage).getCustomData();
 *   return `📍 Shared a location`;
 * });
 *
 * // Register an icon override
 * subtitleService.registerSubtitleIconOverride('location_custom', 'location-pin');
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class ConversationSubtitleService {
  private subtitleFormatters = new Map<MessageTypeKey, SubtitleFormatter>();
  private subtitleIconOverrides = new Map<MessageTypeKey, string>();

  /**
   * Register a subtitle formatter for a message type key.
   * Re-registration replaces the previous formatter.
   */
  registerSubtitleFormatter(typeKey: MessageTypeKey, formatter: SubtitleFormatter): void {
    this.subtitleFormatters.set(typeKey, formatter);
  }

  /**
   * Unregister a subtitle formatter for a message type key.
   */
  unregisterSubtitleFormatter(typeKey: MessageTypeKey): void {
    this.subtitleFormatters.delete(typeKey);
  }

  /**
   * Register a subtitle icon override for a message type key.
   * Re-registration replaces the previous icon name.
   */
  registerSubtitleIconOverride(typeKey: MessageTypeKey, iconName: string): void {
    this.subtitleIconOverrides.set(typeKey, iconName);
  }

  /**
   * Get the formatted subtitle for a message, or `null` if no formatter is registered.
   * If the formatter throws, logs a warning and returns `null`.
   */
  getSubtitle(typeKey: MessageTypeKey, message: CometChat.BaseMessage): string | null {
    const formatter = this.subtitleFormatters.get(typeKey);
    if (!formatter) {
      return null;
    }
    try {
      return formatter(message);
    } catch (error) {
      CometChatLogger.warn(
        'ConversationSubtitleService',
        `Subtitle formatter for "${typeKey}" threw an error:`,
        error
      );
      return null;
    }
  }

  /**
   * Get the icon override for a message type key, or `null` if none is registered.
   */
  getIconOverride(typeKey: MessageTypeKey): string | null {
    return this.subtitleIconOverrides.get(typeKey) ?? null;
  }

  /**
   * Check if a formatter is registered for a given type key.
   */
  hasFormatter(typeKey: MessageTypeKey): boolean {
    return this.subtitleFormatters.has(typeKey);
  }
}
