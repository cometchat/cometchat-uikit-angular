/**
 * CometChatActionBubble Component
 *
 * A standalone component for rendering action/system messages within the chat interface.
 * This component displays messages like "User joined the group", "User left the group",
 * or "Group name changed to X".
 *
 * Features:
 * - Simple text display with centered layout
 * - Pill-shaped container with subtle styling
 * - Optional icon display for call status messages
 * - Full accessibility support
 * - CSS variable-based theming
 *
 * @module components/cometchat-action-bubble
 * @see Requirements 7.1, 7.5, 7.6
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgStyle } from '@angular/common';

/**
 * CometChatActionBubble is a standalone Angular component that renders
 * action/system messages with a centered, pill-shaped appearance.
 *
 * This is a purely presentational component with no internal state.
 * It does NOT accept a CometChat message object - only a plain text string.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-action-bubble
 *   [messageText]="'User joined the group'">
 * </cometchat-action-bubble>
 *
 * <!-- With icon (for call status) -->
 * <cometchat-action-bubble
 *   [messageText]="'Outgoing Call'"
 *   [iconUrl]="'assets/outgoing_video_no_fill.svg'">
 * </cometchat-action-bubble>
 * ```
 *
 * @see Requirements 1.1 - THE Action_Bubble SHALL accept a messageText string input
 * @see Requirements 7.1 - THE Action_Bubble SHALL be a standalone Angular component
 * @see Requirements 7.6 - THE Action_Bubble SHALL use ChangeDetectionStrategy.OnPush
 */
@Component({
  selector: 'cometchat-action-bubble',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './cometchat-action-bubble.component.html',
  styleUrls: ['./cometchat-action-bubble.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatActionBubbleComponent {
  /**
   * The action/system message text to display.
   * If empty, null, undefined, or whitespace-only, the component renders nothing.
   *
   * @see Requirements 1.1, 1.2, 1.3
   */
  @Input() messageText = '';

  /**
   * Optional icon URL to display before the message text.
   * Used for call status messages (outgoing, incoming, missed, etc.).
   * When provided, the icon will be displayed using CSS mask.
   *
   * @see Requirements 4.5, 4.6 - Call messages display with appropriate icons
   */
  @Input() iconUrl = '';

  /**
   * Whether to use error color for the icon.
   * Used for missed call status to show red icon.
   *
   * @see Requirements 4.5, 4.6 - Missed calls show error color
   */
  @Input() iconErrorColor = false;

  /**
   * Determines if the component should render based on messageText validity.
   * Returns true only if messageText is a non-empty, non-whitespace string.
   *
   * @see Requirements 8.1, 8.2, 8.3, 8.4
   */
  get shouldRender(): boolean {
    if (this.messageText === null || this.messageText === undefined) {
      return false;
    }
    return this.messageText.trim().length > 0;
  }

  /**
   * Whether to show the icon element.
   * Returns true if iconUrl is provided.
   */
  get showIcon(): boolean {
    return !!this.iconUrl && this.iconUrl.trim().length > 0;
  }

  /**
   * Gets the icon styles for the mask-based icon display.
   * Uses CSS mask to display the icon with the appropriate color.
   */
  get iconStyles(): Record<string, string> {
    if (!this.iconUrl) {
      return {};
    }
    return {
      display: 'flex',
      '-webkit-mask': `url('${this.iconUrl}') center center no-repeat`,
      mask: `url('${this.iconUrl}') center center no-repeat`,
      '-webkit-mask-size': 'contain',
      'mask-size': 'contain',
    };
  }
}
