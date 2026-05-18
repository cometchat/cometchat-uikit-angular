/**
 * CometChatStickerBubble Component
 *
 * A standalone component for rendering sticker messages within the chat interface.
 * Extracts the sticker image URL from the message's metadata or custom data
 * using a priority-based fallback chain and renders it as an image.
 *
 * @module components/cometchat-sticker-bubble
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLogger } from '../../utils/CometChatLogger';

/**
 * CometChatStickerBubble is a standalone Angular component that renders
 * sticker messages with incoming/outgoing alignment variants.
 *
 * The sticker URL is extracted from the message using a priority chain:
 * 1. `metadata.data.sticker_url`
 * 2. `metadata.sticker_url`
 * 3. `customData.sticker_url`
 *
 * @example
 * ```html
 * <cometchat-sticker-bubble
 *   [message]="stickerMessage"
 *   [alignment]="MessageBubbleAlignment.left">
 * </cometchat-sticker-bubble>
 * ```
 *
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3
 */
@Component({
  selector: 'cometchat-sticker-bubble',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-sticker-bubble.component.html',
  styleUrls: ['./cometchat-sticker-bubble.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatStickerBubbleComponent implements OnChanges {
  /**
   * The sticker custom message to render.
   *
   * @see Requirements 1.2
   */
  @Input() message: CometChat.CustomMessage | null = null;

  /**
   * Bubble alignment — left for incoming, right for outgoing.
   *
   * @see Requirements 1.3
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /** Enum reference for template binding */
  MessageBubbleAlignment = MessageBubbleAlignment;

  /** Cached sticker URL, recomputed on message changes */
  stickerUrl = '';

  /**
   * Recompute stickerUrl when the message input changes.
   *
   * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.stickerUrl = this.getStickerUrl();
    }
  }

  /**
   * Extracts the sticker image URL from the message using a priority-based
   * fallback chain:
   * 1. metadata.data.sticker_url
   * 2. metadata.sticker_url
   * 3. customData.sticker_url
   *
   * @returns The sticker URL string, or empty string if not found
   * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  getStickerUrl(): string {
    if (!this.message) {
      return '';
    }
    try {
      const metadata = (this.message as any).getMetadata?.() as Record<string, any> | null;
      if (!metadata) {
        const customData = (this.message as any).getCustomData?.();
        if (customData?.['sticker_url']) {
          return customData['sticker_url'];
        }
        return '';
      }
      if (metadata['data']?.['sticker_url']) {
        return metadata['data']['sticker_url'];
      }
      if (metadata['sticker_url']) {
        return metadata['sticker_url'];
      }
      const customData = (this.message as any).getCustomData?.();
      if (customData?.['sticker_url']) {
        return customData['sticker_url'];
      }

      return '';
    } catch (error) {
      CometChatLogger.warn('CometChatStickerBubble', 'Error extracting sticker URL:', error);
      return '';
    }
  }
}
