import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatFileBubbleComponent } from '../cometchat-file-bubble/cometchat-file-bubble.component';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

/**
 * CometChatFilesBubble — receive-side bubble for a (multi-)file message (Phase 2).
 * Delegates to the existing `cometchat-file-bubble` (expandable file list + caption). A distinct
 * component so the batch-aware width and grouping live here; the single-attachment
 * `cometchat-file-bubble` is the deprecated primitive it delegates to.
 */
@Component({
  selector: 'cometchat-files-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatFileBubbleComponent],
  template: `<cometchat-file-bubble
    [message]="message"
    [alignment]="alignment"
      [textFormatters]="textFormatters"
  ></cometchat-file-bubble>`,
  // Batch bubbles share one width (--cometchat-multi-attachment-width, default 400px = the React
  // kit's container cap) so every message in a batch renders at the same width.
  styles: [`
    :host { display: block; width: 100%; }
    :host {
      --cometchat-batch-width: var(--cometchat-multi-attachment-width, 400px);
      --cometchat-file-bubble-width: 100%;
      --cometchat-file-bubble-container-max-width: var(--cometchat-batch-width);
    }
  `],
})
export class CometChatFilesBubbleComponent {
  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  /**
   * Formatters applied to the caption's text. Forwarded to the bubble this one
   * delegates to, which renders the caption — nothing is applied here.
   */
  @Input() textFormatters?: CometChatTextFormatter[];
  /** Accepted for parity with other bubbles (file bubble has no interaction toggle). */
  @Input() disableInteraction = false;
}
