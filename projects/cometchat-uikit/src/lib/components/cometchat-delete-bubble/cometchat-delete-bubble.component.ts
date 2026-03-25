/**
 * CometChatDeleteBubble Component
 *
 * A standalone component for rendering deleted message placeholders within the chat interface.
 * This component displays a simple indicator that a message has been deleted.
 *
 * Features:
 * - Delete icon display
 * - Localized "This message was deleted" text (or custom text)
 * - Sender/receiver styling variants
 * - Full accessibility support
 * - CSS variable-based theming
 *
 * @module components/cometchat-delete-bubble
 * @see Requirements 9.1, 9.5
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * CometChatDeleteBubble is a standalone Angular component that renders
 * deleted message placeholders with sender/receiver styling variants.
 *
 * This is a purely presentational component with no internal state.
 * It does NOT accept a CometChat message object - only simple inputs.
 *
 * @example
 * ```html
 * <!-- Receiver variant (default) -->
 * <cometchat-delete-bubble></cometchat-delete-bubble>
 *
 * <!-- Sender variant -->
 * <cometchat-delete-bubble [isSentByMe]="true"></cometchat-delete-bubble>
 *
 * <!-- Custom text -->
 * <cometchat-delete-bubble [text]="'Message removed'"></cometchat-delete-bubble>
 * ```
 *
 * @see Requirements 1.1 - THE Delete_Bubble SHALL accept an isSentByMe boolean input
 * @see Requirements 1.2 - THE Delete_Bubble SHALL accept an optional text string input
 * @see Requirements 9.1 - THE Delete_Bubble SHALL be a standalone Angular component
 */
@Component({
  selector: 'cometchat-delete-bubble',
  standalone: true,
  templateUrl: './cometchat-delete-bubble.component.html',
  styleUrls: ['./cometchat-delete-bubble.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatDeleteBubbleComponent {
  /**
   * Determines sender (outgoing) or receiver (incoming) styling.
   * When true, applies primary color background with white text/icon.
   * When false, applies neutral background with neutral text/icon.
   *
   * @see Requirements 1.1, 1.3, 1.4
   */
  @Input() isSentByMe = false;

  /**
   * Optional custom text to display instead of the default localized text.
   * If not provided, uses the "message_deleted" localization key.
   *
   * @see Requirements 1.2, 1.5, 1.6
   */
  @Input() text?: string;

  /**
   * Returns the text to display - either custom text or localized default.
   * Falls back to localized "message_deleted" text when text is undefined,
   * null, or empty string.
   *
   * @see Requirements 1.5, 1.6, 7.1, 7.2, 7.4
   */
  get displayText(): string {
    if (this.text !== undefined && this.text !== null && this.text.length > 0) {
      return this.text;
    }
    return CometChatLocalize.getLocalizedString('message_deleted');
  }

  /**
   * Returns the CSS class modifier based on isSentByMe.
   * Used for applying sender or receiver styling.
   *
   * @see Requirements 1.3, 1.4, 3.1, 4.1
   */
  get variantClass(): string {
    return this.isSentByMe
      ? 'cometchat-delete-bubble--sender'
      : 'cometchat-delete-bubble--receiver';
  }
}
