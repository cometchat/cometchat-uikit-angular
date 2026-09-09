import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatImageBubbleComponent } from '../cometchat-image-bubble/cometchat-image-bubble.component';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

/**
 * CometChatImagesBubble — receive-side bubble for a (multi-)image message (Phase 2).
 *
 * Renders the message's images (single / grid / overflow) plus the caption, reusing the
 * existing `cometchat-image-bubble` rendering. It is a distinct component so the batch-aware
 * width and grouping live here, leaving the deprecated single-attachment
 * `cometchat-image-bubble` as the primitive it delegates to. Caption-on-last is honored
 * automatically because the composer only sets the caption on the last message of a batch.
 */
@Component({
  selector: 'cometchat-images-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatImageBubbleComponent],
  template: `<cometchat-image-bubble
    [message]="message"
    [alignment]="alignment"
    [disableInteraction]="disableInteraction"
      [textFormatters]="textFormatters"
  ></cometchat-image-bubble>`,
  // Batch bubbles share one width (--cometchat-multi-attachment-width, default 400px = the React
  // kit's container cap) so every message in a batch renders at the same width. See css-variables.css.
  styles: [`
    :host { display: block; width: 100%; }
    :host {
      --cometchat-batch-width: var(--cometchat-multi-attachment-width, 400px);
      --cometchat-image-bubble-single-max-width: var(--cometchat-batch-width);
      --cometchat-image-bubble-grid-max-width: var(--cometchat-batch-width);
      --cometchat-image-bubble-grid-2x2-max-width: var(--cometchat-batch-width);
      --cometchat-image-bubble-overflow-max-width: var(--cometchat-batch-width);
      --cometchat-image-bubble-container-max-width: var(--cometchat-batch-width);
    }
  `],
})
export class CometChatImagesBubbleComponent {
  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  /**
   * Formatters applied to the caption's text. Forwarded to the bubble this one
   * delegates to, which renders the caption — nothing is applied here.
   */
  @Input() textFormatters?: CometChatTextFormatter[];
  @Input() disableInteraction = false;
}
